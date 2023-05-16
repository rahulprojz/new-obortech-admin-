import { useMemo } from 'react'
import moment from 'moment'
import string from '../../utils/LanguageTranslation.js'
import { getLocalTime } from '../../utils/globalFunc'

const { PAGE_SIZE } = process.env

function List({ isLoading, paginationData: { list, totalCount, pageNumber }, user, handleViewData, handleDelete, toggleConfirmationModal }) {
    const isAdmin = user.role_id == process.env.ROLE_ADMIN

    const lastIndex = useMemo(() => {
        return pageNumber * PAGE_SIZE
    }, [pageNumber])

    return (
        <table className='table'>
            <thead className='thead-dark'>
                <tr>
                    <th scope='col'>#</th>
                    <th scope='col'>{string.userDataRequest.requestId}</th>
                    <th scope='col'>{string.userDataRequest.processor}</th>
                    <th scope='col'>{string.userDataRequest.user}</th>
                    <th scope='col'>{string.userDataRequest.purpose}</th>
                    <th scope='col'>{string.userDataRequest.statusDescription}</th>
                    <th scope='col'>{string.userDataRequest.status}</th>
                    <th scope='col'>{string.userDataRequest.createdDate}</th>
                    <th className='text-center' scope='col'>
                        {string.actions}
                    </th>
                </tr>
            </thead>
            <tbody>
                {list.map((request, i) => {
                    // ToDo: for normal users
                    // if (isUser) {
                    //     return false
                    // }

                    let canAcceptReject = false
                    if (isAdmin) {
                        canAcceptReject = request.approved_by_dc || request.rejected_by_dc
                    }
                    if (request.user_id == user.id) {
                        canAcceptReject = request.approved_by_ds || request.rejected_by_ds
                    }

                    const localDate = getLocalTime(request.updatedAt)
                    const validity = moment(localDate, 'YYYY-MM-DD HH:mm:ss').add(request.validity, 'hours')
                    const currentDatetime = moment()
                    const dateDiff = validity.diff(currentDatetime, 'minutes')
                    let eyeIconEnable = request.status == 'approved' && request.approved_by_ds && request.approved_by_dc

                    if (request?.request_purpose?.purpose_key == 'onboardingkyc') {
                        eyeIconEnable = request.status == 'approved' && request.approved_by_ds
                    }
                    let isProcessor = false
                    if (request.processor_id == user.id) {
                        isProcessor = true
                    }

                    return (
                        <tr key={i}>
                            <td>{lastIndex + i + 1}</td>
                            <td>{request.request_id}</td>
                            <td>
                                {request.processor?.username} <br /> ( {request.processor?.user_title.name} )
                            </td>
                            <td>
                                {request.user.username} <br /> ( {request.user.organization.name} )
                            </td>
                            <td>{request.request_purpose.purpose_key}</td>
                            <td>{request.status_description}</td>
                            <td>{request.status}</td>
                            <td>{getLocalTime(request.createdAt)}</td>
                            <td className='action-icons'>
                                {isProcessor ? (
                                    <>
                                        <i title='Delete Request' className='fa fa-trash' onClick={() => handleDelete(request)} />
                                        {eyeIconEnable ? (
                                            <i title='View User Data' className='fa fa-eye' onClick={() => handleViewData(request)} aria-hidden='true' />
                                        ) : (
                                            <i title='View User Data' className='fa fa-eye disabled-icon' aria-hidden='true' />
                                        )}
                                        {request.request_from == 'events' && <i className={request.org_approve_status ? 'disabled-icon fa fa-check' : 'fa fa-check'} title='Approve Organization' onClick={() => toggleConfirmationModal('APPROVE', request)} />}
                                    </>
                                ) : (
                                    <>
                                        <i className={!canAcceptReject ? 'fa fa-check' : 'disabled-icon fa fa-check'} title='Accept Request' onClick={() => toggleConfirmationModal('ACCEPT', request)} />
                                        <i className={!canAcceptReject ? 'fa fa-ban' : 'disabled-icon fa fa-ban'} title='Reject Request' onClick={() => toggleConfirmationModal('REJECT', request)} />
                                    </>
                                )}
                            </td>
                        </tr>
                    )
                })}
                {!totalCount && !isLoading && (
                    <tr>
                        <td colSpan='10' className='text-center'>
                            {string.noData}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}

export default List
