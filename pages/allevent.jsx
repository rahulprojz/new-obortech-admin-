import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import NProgress from 'nprogress'
import { v4 as uuidv4 } from 'uuid'
import { EventContextProvider } from '../store/event/eventContext'
import { WatchAllEventContextProvider } from '../store/watchAllEvent/watchAllEventContext'
import withAuth from '../lib/withAuth'
import RejectionWarning from '../components/approval-modals/RejectionWarning'
import ApprovalRejection from '../components/approval-modals/ApprovalRejection'
import ShareProfile from '../components/approval-modals/ShareProfileAlert'
import { getOrg } from '../lib/api/organization'
import { sendApprovalRejectionEmail, sendProfileEmail, fetchUserById, checkApprovedOrg } from '../lib/api/user'
import { addDataRequest, fetchDataRequest, handleDeleteUserDataRequest } from '../lib/api/user-data-request'
import { callNetworkApi } from '../lib/api/network-api'
import { sanitize, dynamicLanguageStringChange } from '../utils/globalFunc'
import { QrCodeContextProvider } from '../store/event/qrCodeContext'

import string from '../utils/LanguageTranslation'
import notify from '../lib/notifier'

// import EventPage from './event'
// import WatchAllPage from './watchallevent'

// this type of dynamic import for a page is loading the component one by one
// first sidemenu next header next page so its like its takeing more time

const EventPage = dynamic(() => import('./event'), { ssr: false })
const WatchAllPage = dynamic(() => import('./watchallevent'), { ssr: false })

const AllEvent = (props) => {
    const [isOpenWarningModal, setIsOpenWarningModal] = useState(true)
    const [isOpenRejectionModal, setIsOpenRejectionModal] = useState(false)
    const [isOpenShareProfileModal, setIsOpenShareProfileModal] = useState(true)
    const [orgName, setOrgName] = useState('')
    const [userOrgName, setUserOrgName] = useState('')
    const [uId, setUId] = useState('')
    const [rejectType, setRejectType] = useState('user')
    const [aUId, setAUId] = useState('')
    const [loading, setLoading] = useState('')
    const { user } = props

    const handleRejectionModalToggle = () => {
        setIsOpenRejectionModal((prevState) => !prevState)
    }

    const handleWarningModalToggle = () => {
        setIsOpenWarningModal((prevState) => !prevState)
    }

    const handleShareProfileModalToggle = () => {
        setIsOpenShareProfileModal((prevState) => !prevState)
    }

    const isWatchAll = useSelector((state) => state.watchAll.isWatchAll)

    const getOrgDetails = async () => {
        const tempUId = localStorage.getItem('rejectApprovalUserId')
        const tempAUId = localStorage.getItem('rejectApprovalReceiverUserId')
        const type = localStorage.getItem('rejectType')
        setUId(tempUId)
        setAUId(tempAUId)
        setRejectType(type)
        const approvalModalType = localStorage.getItem('approvalModalType')

        if ((approvalModalType == 'rejectApproval' && props.user.id === tempAUId) || (approvalModalType == 'shareProfile' && props.user.id === tempAUId)) {
            if (tempUId && (localStorage.getItem('isOpenRejectApprovalModal') === 'true' || localStorage.getItem('isOpenShareProfileModal') === 'true')) {
                const userData = await fetchUserById({ id: tempUId })
                setOrgName(userData.organization.name)
            }
            const org = await getOrg({ id: props.user.organization_id })
            if (org && org.name) {
                setUserOrgName(org.name)
            }
        } else if (tempUId && tempAUId) {
            const userData = await fetchUserById({ id: tempUId })
            if (approvalModalType === 'rejectApproval' && props.user.id !== tempAUId) {
                const org = userData.organization.name
                notify(dynamicLanguageStringChange(string.event.unAuthorized, { org }))
                localStorage.setItem('isOpenRejectApprovalModal', 'false')
                localStorage.removeItem('rejectApprovalUserId')
                localStorage.removeItem('rejectApprovalReceiverUserId')
                localStorage.removeItem('rejectType')
            } else if (approvalModalType === 'shareProfile' && props.user.id !== tempAUId) {
                const org = userData.organization.name
                localStorage.setItem('isOpenShareProfileModal', 'false')
                localStorage.removeItem('rejectApprovalUserId')
                localStorage.removeItem('rejectApprovalReceiverUserId')
                localStorage.removeItem('rejectType')
                notify(dynamicLanguageStringChange(string.event.unAuthorizedShare, { org }))
            }

            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `/event/${props?.router?.query?.project_id}`)
            }
        }
    }

    useEffect(() => {
        if (!isWatchAll) {
            getOrgDetails()
        }
        setTimeout(() => {
            localStorage.setItem('isOpenRejectApprovalModal', 'false')
            // localStorage.setItem('isOpenShareProfileModal', 'false')
        }, 5000)
    }, [isWatchAll])

    const deleteUserDataRequest = async () => {
        if (uId && userOrgName) {
            await handleDeleteUserDataRequest({ user_id: uId, processor_id: aUId })
            await sendApprovalRejectionEmail({ organization: userOrgName, receiverId: uId, appoverUserId: aUId, rejectType })
        }
        handleWarningModalToggle()
        handleRejectionModalToggle()
        localStorage.setItem('isOpenRejectApprovalModal', 'false')
        localStorage.removeItem('rejectApprovalUserId')
        localStorage.removeItem('rejectApprovalReceiverUserId')
        localStorage.removeItem('rejectType')
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/event/${props?.router?.query?.project_id}`)
        }
    }

    const createUserDataRequest = async () => {
        try {
            if (uId && userOrgName) {
                NProgress.start()
                setLoading(true)
                const approveUser = await fetchUserById({ id: uId })
                const isApprovedOrg = await checkApprovedOrg(approveUser.organization_id)
                // Create User Data Request for Non-Approved (verified_by) users
                if (!isApprovedOrg.status) {
                    const uniq_id = approveUser.unique_id.toLowerCase()

                    // Get organization
                    const organization = await getOrg({
                        id: approveUser.organization_id,
                    })
                    // Get access token
                    const accesstoken = props.cookies.authToken
                    if (accesstoken.error) {
                        throw accesstoken.error
                    }

                    // Create/get processor
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
                        userid: user.unique_id,
                        purpose: 'onboardingkyc',
                        validity: policyResponse.data.validity,
                        status: 'approved',
                        status_desc: 'User data requested',
                        requestUniqId: req_uniq_id,
                        is_delete_request: 0,
                        approved_by_dc: 1,
                        approved_by_ds: 1,
                    }

                    const createRequestResponse = await callNetworkApi(accesstoken, 'create-data-request', requestObj)
                    if (!createRequestResponse.success) {
                        throw createRequestResponse.error
                    }

                    const userDataRequest = await addDataRequest({
                        requestObj,
                        processor_id: approveUser.id,
                        controller_id: controllerResponse.data.controllerID,
                        request_txn_id: createRequestResponse.data,
                        policy: policyResponse.data,
                        request_from: 'events',
                    })

                    if (userDataRequest.error) {
                        throw userDataRequest.error
                    }
                }
                setLoading(false)
                NProgress.done()
            }
            await sendProfileEmail({ organization: userOrgName, receiverId: uId })
            handleShareProfileModalToggle()
            localStorage.setItem('isOpenShareProfileModal', 'false')
            localStorage.removeItem('rejectApprovalUserId')
            localStorage.removeItem('rejectApprovalReceiverUserId')
            localStorage.removeItem('rejectType')
            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `${props?.router?.query?.project_id}`)
            }
        } catch (err) {
            setLoading(false)
            NProgress.done()
            console.log(err)
        }
    }

    if (isWatchAll)
        return (
            <EventContextProvider>
                <WatchAllEventContextProvider>
                    <WatchAllPage {...props} />
                </WatchAllEventContextProvider>
            </EventContextProvider>
        )

    return (
        <>
            <QrCodeContextProvider>
                <EventContextProvider>
                    <EventPage {...props} />
                </EventContextProvider>
            </QrCodeContextProvider>
            <RejectionWarning
                isOpen={isOpenWarningModal && orgName && localStorage.getItem('isOpenRejectApprovalModal') === 'true'}
                orgName={orgName}
                onToggle={handleWarningModalToggle}
                onSubmit={() => {
                    deleteUserDataRequest()
                }}
            />
            <ApprovalRejection isOpen={isOpenRejectionModal} orgName={orgName} onToggle={handleRejectionModalToggle} />
            <ShareProfile
                isOpen={isOpenShareProfileModal && orgName && localStorage.getItem('isOpenShareProfileModal') === 'true'}
                orgName={orgName}
                loading={loading}
                onToggle={handleShareProfileModalToggle}
                onSubmit={async () => {
                    await createUserDataRequest()
                }}
            />
        </>
    )
}

export default withAuth(AllEvent, { loginRequired: true })
