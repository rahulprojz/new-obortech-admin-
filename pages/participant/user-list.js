import string from '../../utils/LanguageTranslation.js'
import { getLocalTime } from '../../utils/globalFunc'

function UserList({ organization, setEditMode, canSeeUser, setDeleteMode, toggleApproveDisapproveModal, onUserVerify, user, viewUserDetails, isApprovedByOrg = null }) {
    const isCeoUser = process.env.ROLE_CEO == user.role_id
    const isSeniorManager = process.env.ROLE_SENIOR_MANAGER == user.role_id
    const isAdmin = process.env.ROLE_ADMIN == user.role_id
    const isManagerUser = process.env.ROLE_MANAGER == user.role_id
    const isInvitedOrg = organization.invited_by == user.organization_id
    const checkUserExistInOrg = (org) => {
        if (org.organization && user.organization) {
            const checkPermission = org.organization.id === user.organization.id
            if (!checkPermission) {
                return org.role.id === parseInt(process.env.ROLE_CEO) || org.role.id === parseInt(process.env.ROLE_SENIOR_MANAGER)
            } else {
                return true
            }
        }
        return false
    }

    return (
        <table className='table'>
            <thead className='thead-dark users-list-table'>
                <tr>
                    <th scope='col'>#</th>
                    <th scope='col'>{string.participant.userName}</th>
                    <th scope='col'>{string.role}</th>
                    <th scope='col'>{string.onboarding.title}</th>
                    <th scope='col'>{string.project.createdAt}</th>
                    <th scope='col collapsed-table' style={{ textAlign: 'center' }}>
                        {string.actions}
                    </th>
                </tr>
            </thead>
            <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '20%' }} />
            </colgroup>
            <tbody>
                {organization?.users.map((orgUser, j) => {
                    const editMode = isSeniorManager || isCeoUser || isAdmin || isManagerUser ? orgUser.role_id == process.env.ROLE_PUBLIC_USER : orgUser.role_id != process.env.ROLE_CEO && orgUser.role_id != process.env.ROLE_ADMIN
                    const enableOrg = checkUserExistInOrg(orgUser)
                    const editModePencil = isAdmin || isManagerUser ? orgUser.role_id == process.env.ROLE_PUBLIC_USER : orgUser.role_id != process.env.ROLE_CEO && orgUser.role_id != process.env.ROLE_ADMIN
                    const isOrgCeoUser = process.env.ROLE_CEO == orgUser.role_id
                    const isOrgSeniorManager = process.env.ROLE_SENIOR_MANAGER == orgUser.role_id
                    const canSeeUser = user.id != orgUser.id
                    const canSeeTrashCheck = isAdmin ? !canSeeUser : process.env.ROLE_ADMIN == orgUser.role_id || !canSeeUser

                    return (
                        enableOrg && (
                            <tr key={j}>
                                <td>{j + 1}</td>
                                <td
                                    className={canSeeUser && editMode ? '' : 'approve-cursor-pointer'}
                                    onClick={() => {
                                        if (canSeeUser && editMode) {
                                            return false
                                        } else {
                                            viewUserDetails(orgUser)
                                        }
                                    }}
                                >
                                    {orgUser.username}
                                </td>
                                <td>{orgUser.role?.name}</td>
                                <td>{orgUser.user_title?.name}</td>
                                <td>{getLocalTime(orgUser.createdAt)}</td>
                                <td>
                                    <i className='fa fa-eye' style={{ visibility: canSeeUser && editMode ? 'hidden' : 'visible' }} onClick={() => viewUserDetails(orgUser)} />
                                    <i className='fa fa-pencil-alt' style={{ visibility: canSeeUser && editModePencil ? 'visible' : 'hidden' }} onClick={() => setEditMode('participant', j, orgUser)} />
                                    <i className='fa fa-trash' style={{ visibility: canSeeTrashCheck || (user.organization_id != orgUser.organization.id && !isAdmin) ? 'hidden' : 'visible' }} onClick={() => setDeleteMode('participant', j, orgUser)} />
                                    {!isManagerUser && isOrgCeoUser || isOrgSeniorManager && orgUser.added_to_network && !isInvitedOrg ? (
                                        <i
                                            className={`fas fa-check verify-cursor-pointer  ${isOrgSeniorManager ? orgUser.isApproved : !!isApprovedByOrg}`}
                                            style={{ visibility: canSeeTrashCheck ? 'hidden' : 'visible' }}
                                            onClick={() => {
                                                if (!isManagerUser) onUserVerify(orgUser, !!isApprovedByOrg ? 0 : 1)
                                            }}
                                            title={!!isApprovedByOrg ? string.unVerifyThisUser : string.verifyThisUser}
                                        />
                                    ) : (
                                        <i
                                            className={`fas fa-check ${orgUser.isApproved} approve-cursor-pointer`}
                                            style={{ visibility: canSeeTrashCheck ? 'hidden' : 'visible' }}
                                            title={orgUser.isApproved ? `${string.disApproveThisUser}` : `${string.approveThisUser}`}
                                            onClick={() => {
                                                if (isManagerUser && isOrgCeoUser || isOrgSeniorManager) {
                                                    return
                                                } else {
                                                    toggleApproveDisapproveModal(orgUser)
                                                }
                                            }}
                                        />
                                    )}
                                </td>
                            </tr>
                        )
                    )
                })}
            </tbody>
        </table>
    )
}
export default UserList
