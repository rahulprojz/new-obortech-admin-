import React, { useEffect, useState } from 'react'
import Router from 'next/router'
import NProgress from 'nprogress'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { v4 as uuidv4 } from 'uuid'
import { withCookies } from 'react-cookie'
import { getOrg } from '../../lib/api/organization'
import { callNetworkApi } from '../../lib/api/network-api'
import ProfileCard from '../profile/ProfileCard'
import string from '../../utils/LanguageTranslation.js'
import { fetchApprovals, approveOrg } from '../../lib/api/org-approval'
import { addDataRequest, fetchDataRequest } from '../../lib/api/user-data-request'
import notify from '../../lib/notifier'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import '../profile/profile.css'
import '../../static/css/modal.css'
import { sanitize } from '../../utils/globalFunc'
import OrgCard from '../profile/OrgCard'
import UserProfileCard from '../profile/UserProfileCard'

const OrgApprovalModal = ({ isOpen, user, auth_user, onToggle, onFetchEvents, didApprove, project_event, cookies }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [orgData, setOrgData] = useState({ user: {}, approvals: [] })
    const canApprove = !!(auth_user.role_id == process.env.ROLE_MANAGER || auth_user.role_id == process.env.ROLE_CEO || auth_user.role_id == process.env.ROLE_SENIOR_MANAGER)

    useEffect(() => {
        if (user?.organization_id) {
            fetchApprovals(user.organization_id).then((data) => {
                if (data) {
                    setOrgData({
                        user: data.ceoUser || {},
                        approvals: data.approvals || [],
                    })
                }
            })
        }
    }, [user?.organization_id])

    const _handleApproveOrg = async () => {
        if (!user.organization_id || !auth_user.organization_id) {
            return
        }
        await approveOrg({
            org_id: user.organization_id,
            approver_org_id: auth_user.organization_id,
            processor_id: auth_user.id,
            user_id: orgData.user?.id,
        })
        notify(string.organization.orgApprovedSuccess)
        onToggle()
        onFetchEvents()
    }

    const _handleRequestData = async () => {
        try {
            NProgress.start()
            setIsLoading(true)

            const uniq_id = orgData.user.unique_id.toLowerCase()

            // Get organization
            const organization = await getOrg({
                id: orgData.user.organization_id,
            })
            // Get access token
            const accesstoken = cookies.cookies.authToken
            if (accesstoken.error) {
                throw accesstoken.error
            }
            //Create/get processor
            const processorBodyObj = {
                userId: uniq_id,
                orgName: sanitize(organization.blockchain_name),
            }
            const processorResponse = await callNetworkApi(accesstoken, 'create-processor', processorBodyObj)
            if (!processorResponse.success) {
                throw processorResponse.error
            }

            // Check if request already exists
            const requestExists = await fetchDataRequest({ userid: uniq_id })
            if (requestExists.length > 0) {
                throw string.errors.requestAlreadyExists
            }

            // Get controller
            const controllerReqObj = {
                orgName: 'obortech',
                userName: 'oboadmin',
            }
            const controllerResponse = await callNetworkApi(accesstoken, 'get-controller', controllerReqObj)
            if (!controllerResponse.success) {
                throw controllerResponse.error
            }

            // Get policy by purpose
            const policyReqObj = {
                purpose: 'onboardingkyc',
            }
            const policyResponse = await callNetworkApi(accesstoken, 'get-policy', policyReqObj, false, {}, 'GET')
            if (!policyResponse.success) {
                throw policyResponse.error
            }

            const uuid = uuidv4().split('-')
            const req_uniq_id = uuid[0].toUpperCase()

            // Create user data request
            const requestObj = {
                processorid: processorResponse.data,
                userid: uniq_id,
                purpose: 'onboardingkyc',
                validity: policyResponse.data.validity,
                status: 'open',
                status_desc: 'User data requested',
                requestUniqId: req_uniq_id,
                is_delete_request: 0,
                orgName: sanitize(organization.blockchain_name),
            }

            const createRequestResponse = await callNetworkApi(accesstoken, 'create-data-request', requestObj)
            if (!createRequestResponse.success) {
                throw createRequestResponse.error
            }

            const userDataRequest = await addDataRequest({
                requestObj,
                controller_id: controllerResponse.data.controllerID,
                request_txn_id: createRequestResponse.data,
                policy: policyResponse.data,
                request_from: 'events',
            })

            if (userDataRequest.error) {
                throw userDataRequest.error
            }

            Router.push('/user-data-request')
        } catch (err) {
            notify(err.message || err.toString())
        }

        NProgress.done()
        setIsLoading(false)
    }

    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='modal-lg profile-modal customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={onToggle}>
                {string.organization.orgProfile}
            </ModalHeader>
            <ModalBody>
                <div className='d-flex flex-column align-items-center'>
                    <div className='details-wrap'>
                        <div className='card-wrap' style={{ border: 'none' }}>
                            <OrgCard
                                heading={user?.organization?.name || ''}
                                userData={user?.organization?.country_id == 146 ? user : ''}
                                caption={user?.organization?.user_type?.name || ''}
                                showVerified='1'
                                icon='frieght-icon'
                                idData={user?.organization?.unique_id ? { label: string.onboarding.orgId, id: user?.organization?.unique_id } : ''}
                                approverOrgs={orgData.approvals}
                            />
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <ProfileCard
                                    heading={orgData.user.username || ''}
                                    caption={orgData.user['user_title.name'] || ''}
                                    showVerified='0'
                                    icon='admin-icon'
                                    idData={orgData.user.unique_id ? { label: string.onboarding.userId, id: orgData.user.unique_id } : ''}
                                    approverOrgs={orgData.approvals}
                                />
                                {!didApprove && canApprove && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <button className='btn btn-primary large-btn' onClick={_handleApproveOrg}>
                                            {string.approveBtn}
                                        </button>
                                        <LoaderButton style={{ marginTop: '5px' }} cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.organization.kycReqBtn} onClick={_handleRequestData} />
                                    </div>
                                )}
                            </div>
                            <UserProfileCard userData={user?.organization?.country_id == 146 ? user : ''} showVerified='0' approverOrgs={[]} user={user} />
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    )
}

export default withCookies(OrgApprovalModal)
