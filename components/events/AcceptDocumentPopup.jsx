import { useEffect, useRef, useState, useContext } from 'react'
import _ from 'lodash'
import { useOutsideClick } from '../../utils/customHooks/useClickOutside'
import string from '../../utils/LanguageTranslation.js'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import FormatLabel from '../UI/Label'
import EventContext from '../../store/event/eventContext'
import { fetchProjectAcceptUsers } from '../../lib/api/project-event'

const AcceptDocumentPopup = ({ project, isEditableMode = true, project_event, project_event_id, isExpired, expiryDate, allRejected, allAccepted, toggle, acceptreject, documentAcceptedUsers, user, isOpen, customCSS = {}, toggleClose, cssClasses, subEvent }) => {
    const [accepted, setAccepted] = useState(false)
    const [isAcceptVisible, setIsAcceptVisible] = useState(false)
    const acceptRef = useRef(null)
    const isOutside = useOutsideClick(acceptRef)
    const [userOptions, setUserOptions] = useState([])
    const view_users = ''
    const { projectEventUsers } = useContext(EventContext)

    const fetchEventUsersList = async () => {
        const projectAcceptUsers = await fetchProjectAcceptUsers({ project_event_id })
        if (projectAcceptUsers.length) {
            const options = projectAcceptUsers
                .filter((accept) => {
                    return !documentAcceptedUsers.some((dAccept) => dAccept.user_id == accept.user_id)
                })
                .map((accept) => {
                    const user = accept.user
                    const organization = accept.organization
                    return {
                        label: `${user.username} ${organization.name}`,
                        userName: user.username,
                        organizationName: organization.name,
                        value: `${user.id}-${organization.id}`,
                    }
                })

            if (options.some((item) => item.userName == user.username)) setIsAcceptVisible(true)
            setUserOptions(options)
        }
    }

    useEffect(() => {
        if (!!isOpen && !!isOutside) {
            toggle(null)
        }
    }, [isOutside])

    useEffect(() => {
        fetchEventUsersList()
    }, [])

    let canAccept = false
    if (accepted || isExpired) {
        canAccept = false
    } else {
        canAccept = true
    }

    let isPublicUser = false
    if (user.role_id == process.env.ROLE_PUBLIC_USER) {
        isPublicUser = true
    }

    const isNotCompleted = !project?.is_completed

    return (
        <div className={cssClasses} style={customCSS} ref={acceptRef}>
            {!subEvent && (
                <>
                    {!isPublicUser && (
                        <div>
                            {!allRejected && !allAccepted && isExpired && (
                                <p className='text-dark deadline-col'>
                                    {string.emailmessages.deadlineAccept} <span className='text-danger'>{string.expiredtext}</span>
                                </p>
                            )}

                            {allRejected && (
                                <p className='text-dark deadline-col'>
                                    <span className='text-danger'>{string.rejectedtext}</span>
                                </p>
                            )}

                            {!allRejected && allAccepted && (
                                <p className='text-dark deadline-col'>
                                    <span className='text-success'>{string.acceptedtext}</span>
                                </p>
                            )}

                            {!allRejected && !allAccepted && !isExpired && (
                                <p className='text-dark deadline-col'>
                                    {string.emailmessages.deadlineAccept} <span className='text-success'>{expiryDate}</span>
                                </p>
                            )}
                        </div>
                    )}
                    {!!userOptions.length && (
                        <AdvanceSelect
                            className='basic-single mb-3'
                            classNamePrefix='select'
                            name={string.fileName}
                            options={_.uniqBy(userOptions, 'value')}
                            formatOptionLabel={(data) => <FormatLabel user={data?.userName} org={data?.organizationName} />}
                            placeholder={string.event.pendingUsers}
                            value={view_users}
                        />
                    )}
                </>
            )}
            <i className='fa fa-times-circle document-action-btn close-btn' onClick={() => toggle(null)} />
            <div className='main-content-body doc-accepted-users-list'>
                <p className='text-dark modal-header-text'>{string.docAcceptedBy}</p>
                {documentAcceptedUsers.map((document_accept, i) => {
                    document_accept.user = projectEventUsers.find((user) => user.id == document_accept.user_id)
                    if (!accepted && document_accept.user_id == parseInt(user.id) && document_accept.accepted) {
                        setAccepted(true)
                    }

                    if (document_accept.is_rejected == '0') {
                        return (
                            <p key={i} className='text-dark-50'>
                                <label style={{ color: '#E68B00', margin: 0 }}>{document_accept.user?.username}</label> <label style={{ color: '#A56F32' }}>{document_accept?.user?.organization?.name}</label>
                            </p>
                        )
                    }
                })}
                <p className='text-dark modal-header-text rejected-header-text'>{string.docRejecteddBy}</p>
                {documentAcceptedUsers.map((document_accept, i) => {
                    document_accept.user = projectEventUsers.find((user) => user.id == document_accept.user_id)
                    if (!accepted && document_accept?.user_id == parseInt(user?.id) && document_accept.rejected) {
                        setAccepted(true)
                    }
                    if (document_accept.is_rejected == '1') {
                        return (
                            <p key={i} className='text-dark-50'>
                                <label style={{ color: '#E68B00', margin: 0 }}>{document_accept?.user?.username}</label> <label style={{ color: '#A56F32' }}>{document_accept?.user?.organization?.name}</label>
                            </p>
                        )
                    }
                })}
                {isEditableMode && canAccept && isAcceptVisible && !subEvent && isNotCompleted && (
                    <>
                        <p
                            className='accept-btn'
                            onClick={() => {
                                setAccepted(true)
                                toggle()
                                toggleClose()
                                acceptreject('accept')
                            }}
                        >
                            <a className='text-warning'>{string.acceptDoc}</a>
                        </p>
                        <p
                            className='reject-btn'
                            onClick={() => {
                                setAccepted(true)
                                toggle()
                                toggleClose()
                                acceptreject('reject')
                            }}
                        >
                            <a className='text-warning'>{string.rejectDoc}</a>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

export default AcceptDocumentPopup
