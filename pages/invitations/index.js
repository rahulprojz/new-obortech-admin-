import jwt_decode from 'jwt-decode'
import NProgress from 'nprogress'
import React, { useEffect, useMemo, useState } from 'react'

import string from '../../utils/LanguageTranslation.js'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import DeleteModal from '../../components/common/DeleteModal.jsx'
import Loader from '../../components/common/Loader'
import { fetchInvitations } from '../../lib/api/invitation'
import { resendInviteUser, resendInviteOrganization, inviteRemove } from '../../lib/api/organization'
import notify from '../../lib/notifier.js'
import withAuth from '../../lib/withAuth'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'
import { getLocalTime } from '../../utils/globalFunc'

let globalState = INITIAL_PAGINATION_STATE
let timer
const Invitations = () => {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [paginationData, setPaginationData] = useState(INITIAL_PAGINATION_STATE)
    const [loadingMode, setLoadingMode] = useState('')
    const [isBtnLoading, setIsBtnLoading] = useState(false)
    const [index, setIndex] = useState(0)
    const [selectedInvitation, setSelectedInvitation] = useState(null)

    const handleFetchInvitationList = (params = {}) => {
        NProgress.start()
        try {
            setLoadingMode(LOADER_TYPES.INVITATIONS)
            const query = { ...params, ...globalState }
            fetchInvitations(getPaginationQuery(query))
                .then((response) => {
                    query.response = response
                    setLoadingMode('')
                    const data = getPaginationState(query)
                    setPaginationData(data)
                    globalState = data
                    NProgress.done()
                })
                .catch(() => {
                    setLoadingMode('')
                    NProgress.done()
                })
        } catch (err) {
            setLoadingMode('')
            NProgress.done()
        }
    }

    useEffect(() => {
        handleFetchInvitationList()
        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                const { list, totalCount, pageNumber } = globalState
                if (list.length < totalCount) {
                    handleFetchInvitationList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    const inviteUser = async (userData) => {
        NProgress.start()
        setIsBtnLoading(true)
        try {
            const jwtToken = jwt_decode(userData.invitation_link)
            const inviteResponse = await resendInviteUser({ ...userData, ...jwtToken })
            if (inviteResponse.message === 'Success') {
                notify(string.apiResponses.orgInvitedSuccess)
            }
        } catch (err) {
            notify(string.organization.userInviteErr)
        }
        setIsBtnLoading(false)
        setSelectedInvitation(null)
        NProgress.done()
    }

    const inviteOrganization = async (orgData) => {
        NProgress.start()
        setIsBtnLoading(true)
        try {
            const jwtToken = jwt_decode(orgData.invitation_link)
            const inviteResponse = await resendInviteOrganization({ ...orgData, ...jwtToken })
            if (inviteResponse.message === 'Success') {
                notify(string.apiResponses.orgInvitedSuccess)
            }
        } catch (err) {
            notify(string.organization.organizationInviteErr)
        }
        setIsBtnLoading(false)
        setSelectedInvitation(null)
        NProgress.done()
    }

    const inviteDelete = async () => {
        setLoadingMode(LOADER_TYPES.DELETE)
        const removeResponse = await inviteRemove(paginationData.list[index])
        if (removeResponse) {
            notify(string.apiResponses.invitationDeletedSuccess)
            handleFetchInvitationList({ isFetchAll: true })
            setLoadingMode('')
        }
        setDeleteOpen(!deleteOpen)
    }

    const isFetchingList = useMemo(() => LOADER_TYPES.INVITATIONS === loadingMode, [loadingMode])

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-pane fade show active mt-3 col-md-12' id='all2' role='tabpanel' aria-labelledby='all-containers'>
                        <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter'>
                            <h4 className='text-dark'>{string.invitation.invitationsListing}</h4>
                        </div>
                        <div style={{ minHeight: '200px' }} className='project-table-listing table-responsive mt-2'>
                            <table className='table'>
                                <thead className='thead-dark'>
                                    <tr>
                                        <th scope='col'>#</th>
                                        <th scope='col'>{string.invitation.name}</th>
                                        <th scope='col'>{string.invitation.email}</th>
                                        <th scope='col'>{string.invitation.type}</th>
                                        <th scope='col'>{string.invitation.createdAt}</th>
                                        <th className='text-center' scope='col'>
                                            {string.actions}
                                        </th>
                                    </tr>
                                </thead>
                                <colgroup>
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                </colgroup>
                                <tbody>
                                    {paginationData?.list?.map((invitation, i) => (
                                        <React.Fragment key={invitation.id}>
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td style={{ textAlign: 'left' }}>{`${invitation.first_name} ${invitation.last_name}`}</td>
                                                <td className='project-name-blk'>{invitation.email}</td>
                                                <td className='project-name-blk'>{invitation.invitation_type}</td>
                                                <td className='project-name-blk'>{getLocalTime(invitation.createdAt)}</td>
                                                <td>
                                                    <i title='Resend invitation' className='fa fa-retweet' onClick={() => setSelectedInvitation(invitation)} />
                                                    <i
                                                        title='Delete'
                                                        className='fa fa-trash'
                                                        onClick={() => {
                                                            setDeleteOpen(true)
                                                            setIndex(i)
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    <NoDataView list={paginationData.list} isLoading={isFetchingList} />
                                </tbody>
                            </table>
                        </div>

                        {/* DELETE INVITE RECORD */}
                        <DeleteModal isLoading={LOADER_TYPES.DELETE === loadingMode} toggle={() => setDeleteOpen(!deleteOpen)} isOpen={deleteOpen} onDeleteEntry={inviteDelete} />

                        {/* RESEND INVITE RECORD */}
                        <ConfirmationModal
                            isOpen={!!selectedInvitation}
                            isLoading={isBtnLoading}
                            toggle={() => setSelectedInvitation(null)}
                            onSubmit={() => {
                                selectedInvitation.invitation_type === 'user' ? inviteUser(selectedInvitation) : inviteOrganization(selectedInvitation)
                            }}
                        />
                    </div>
                </div>
                {isFetchingList && <Loader className='pagination-loader' />}
            </div>
        </div>
    )
}

export default withAuth(Invitations, { loginRequired: true })
