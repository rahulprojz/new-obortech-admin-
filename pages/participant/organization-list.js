import React, { useState, useMemo, useEffect } from 'react'
import string from '../../utils/LanguageTranslation.js'
import { getLocalTime } from '../../utils/globalFunc'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import { Collapse } from 'reactstrap'
import UserList from './user-list'
import Loader from '../../components/common/Loader'
import { LOADER_TYPES } from '../../shared/constants'
import NoDataView from '../../components/common/NoDataView'
import DeleteOrganization from './modals/DeleteOrginization'
import { deleteApproval, deleteApprovalVerify } from '../../lib/api/delete-approval.js'
import { useRouter } from 'next/router'
import notify from '../../lib/notifier.js'

function OrganizationList({ loadingMode, organizations: { list }, onUserVerify, user, viewOrganizationDetails, viewUserDetails, setEditMode, setDeleteMode, setApproveMode, toggleApproveDisapproveModal }) {
    const isAdmin = user.role_id == process.env.ROLE_ADMIN
    const [openAcc, setOpenAcc] = useState(null)
    const [isOpenOrgDelModal, setIsOpenOrgDelModal] = useState(false)
    const [orgDelApproval, setDelOrgApproval] = useState({})
    const [delOrgData, setDeleteOrgData] = useState({})
    const router = useRouter()
    const moduleName = 'organization'
    const _toggleAcc = (idx) => {
        if (idx === openAcc) {
            setOpenAcc(null)
        } else {
            setOpenAcc(idx)
        }
    }
    // console.log('Organization --> ', list)
    const isLoading = useMemo(() => {
        return LOADER_TYPES.ORGANIZATIONS === loadingMode
    }, [loadingMode])

    const approveAccess = user.role_id == process.env.ROLE_SENIOR_MANAGER || user.role_id == process.env.ROLE_CEO || user.role_id == process.env.ROLE_SENIOR_MANAGER || user.role_id == process.env.ROLE_ADMIN
    const checkOrgDeleteStatus = async (payload) => {
        setIsOpenOrgDelModal(true)
        const { deleteAllowed, deleted, pending, success } = await deleteApprovalVerify(payload)

        if (success) {
            setDelOrgApproval({ deleteAllowed, deleted, pending })
            if (deleteAllowed) {
                setIsOpenOrgDelModal(false)
                setDeleteMode(moduleName, delOrgData.i, delOrgData)
            }
        }
        return deleted.length
    }
    const deleteOrgHandler = async (module_name, organization, mode = '') => {
        setIsOpenOrgDelModal(true)
        setDelOrgApproval({})
        const { id: module_id } = organization
        let payload = { module_id, module_name }
        if (mode) payload['mode'] = mode
        const { success } = await deleteApproval(payload)
        if (success) {
            delete payload['mode']
            const isDeleted = await checkOrgDeleteStatus(payload)
            if (isDeleted) {
                return false
            }
        } else setIsOpenOrgDelModal(false)
        return true
    }

    const approveDeleteOrgFromMail = async (orgId) => {
        let organization = list.find((organization) => organization.id === orgId)
        if (organization) {
            let payload = { module_id: organization.id, module_name: moduleName }
            const resp = await deleteApprovalVerify(payload)
            setDelOrgApproval(resp)
            setDeleteOrgData(organization)
            setIsOpenOrgDelModal(true)
        }
    }

    const onDelete = async () => {
        const alreadyDeleted = orgDelApproval.deleted?.find((u) => u.id == user.id)
        if (alreadyDeleted) {
            notify(string.organization.organizationDeleteSuccessAlready)
        } else {
            let res = await deleteOrgHandler(moduleName, delOrgData)
            setIsOpenOrgDelModal(false)
            if (res) {
                const queryParams = new URLSearchParams(window.location.search)
                const orgId = queryParams.get('orgId')
                if (orgId) notify(string.organization.approvedSuccessfully)
                else notify(string.organization.orgDelApprovalMailSent)
            }
        }
        // Remove the Org id from the Query param
        window.history.replaceState(null, '', '/participant')
    }

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search)
        const orgId = queryParams.get('orgId')
        if (orgId && list.length > 0) approveDeleteOrgFromMail(parseInt(orgId))
    }, [list])

    return (
        <>
            <DeleteOrganization orgDelApproval={orgDelApproval} modal={isOpenOrgDelModal} setModal={setIsOpenOrgDelModal} onDelete={onDelete} />
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.tableColName}</th>
                            <th scope='col'>{string.onboarding.type}</th>
                            <th scope='col'>{string.project.createdAt}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <tbody>
                        {list.map((organization, i) => {
                            // Storing Index
                            organization.i = i

                            const canSeeUser = user.organization_id == organization.id ? true : false
                            const isApprovedByOrg = organization.organization_approvals.length ? organization.organization_approvals.find((approvers) => approvers.isVerified && approvers.approved_by == user.organization_id) : null

                            return (
                                <React.Fragment key={organization.id}>
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>
                                            {otherLanguage && organization?.local_name ? organization?.local_name : organization?.name}
                                            {organization.sync_status == 1 && (
                                                <label title={string.organization.blocks_syncing_title} style={{ color: '#ff0000' }}>
                                                    ({string.organization.syncing_blocks})
                                                </label>
                                            )}
                                        </td>
                                        <td>{organization?.user_type?.name}</td>
                                        <td>{getLocalTime(organization.createdAt)}</td>
                                        <td className='project-actions'>
                                            <i className='fa fa-eye' style={{ visibility: !!isApprovedByOrg || organization.id == user.organization_id ? 'hidden' : 'visible' }} onClick={() => viewOrganizationDetails(organization)} />
                                            <i className='fa fa-pencil-alt' style={{ visibility: organization.sync_status != 1 && (organization.id == user.organization_id || isAdmin) ? 'visible' : 'hidden' }} onClick={() => setEditMode('organization', i, organization)} />
                                            {/* {isAdmin && (
                                                <i
                                                    className='fa fa-trash'
                                                    style={{ visibility: organization.id > 1 && organization.sync_status > 1 ? 'visible' : 'hidden' }}
                                                    onClick={() => {
                                                        setDeleteOrgData({ ...organization })
                                                        deleteOrgHandler(moduleName, organization, "new")
                                                    }}
                                                />
                                            )} */}
                                            <i
                                                className={`fas fa-check ${!!isApprovedByOrg}`}
                                                style={{ visibility: canSeeUser || user.role_id == process.env.ROLE_MANAGER ? 'hidden' : 'visible' }}
                                                title={!!isApprovedByOrg ? `${string.userApproved}` : `${string.approveThisOrg}`}
                                                onClick={() => {
                                                    if (!isApprovedByOrg && organization.sync_status != 1) {
                                                        setApproveMode('organization', i)
                                                    }
                                                }}
                                            />
                                            <i className={!!isApprovedByOrg || organization.id == user.organization_id ? 'fa fa-caret-down' : 'fa fa-caret-down disabled-icon'} onClick={() => _toggleAcc(i)} />
                                        </td>
                                    </tr>
                                    <tr className='eventCat'>
                                        <td colSpan='10' className='p-0 eventCatExpand collapsedUser'>
                                            <Collapse isOpen={openAcc === i}>
                                                {organization.users.length > 0 && organization.sync_status == 2 && (
                                                    <UserList
                                                        organization={organization}
                                                        setEditMode={setEditMode}
                                                        canSeeUser={canSeeUser}
                                                        user={user}
                                                        setDeleteMode={setDeleteMode}
                                                        toggleApproveDisapproveModal={toggleApproveDisapproveModal}
                                                        viewUserDetails={viewUserDetails}
                                                        onUserVerify={onUserVerify}
                                                        isApprovedByOrg={isApprovedByOrg}
                                                    />
                                                )}
                                                {organization.users.length == 0 && organization.sync_status != 1 && <div className='d-flex justify-content-center'>{string.noData}</div>}
                                                {organization.sync_status == 1 && <div className='d-flex justify-content-center'>{string.organization.blocks_syncing_title}</div>}
                                            </Collapse>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                        <NoDataView list={list} isLoading={isLoading} />
                    </tbody>
                </table>
            </div>
            {isLoading && <Loader className='pagination-loader' />}
        </>
    )
}

export default OrganizationList
