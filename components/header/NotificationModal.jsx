import { useState, useRef, useCallback, useEffect } from 'react'
import Router from 'next/router'
import filter from 'lodash/filter'
import { useSelector } from 'react-redux'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { fetchNotifications, readNotification, readAllNotifications } from '../../lib/api/notification'
import string from '../../utils/LanguageTranslation'
import { dynamicLanguageStringChange, momentStaticAgo } from '../../utils/globalFunc'
import Loader from '../common/Loader'
import { getOrgs } from '../../redux/selectors/organizationSelector'
import { getSystemEvents } from '../../redux/selectors/eventSelector'
import { otherLanguage } from '../../utils/selectedLanguage'

const GLOBAL_LIMIT = 20
let GLOBAL_OFFSET = 0

function NotificationModal({ isOpen, toggle, user }) {
    const [offset, setOffset] = useState(1)
    const [unreadNotifications, setUnreadNotifications] = useState([])
    const [notifications, setNotifications] = useState([])
    const [isLoading, setLoading] = useState(false)
    const systemEvents = useSelector(getSystemEvents)
    const orgList = useSelector(getOrgs)
    const listRef = useRef()
    const [previousScroll, setPreviousScroll] = useState(0)

    const actionText = {
        COMMENT: string.notificationPopup.actionText.COMMENT,
        SUBMIT: string.notificationPopup.actionText.SUBMIT,
        DOCUMENT_ACCEPT: string.notificationPopup.actionText.ACCEPTED,
        EVENT_ACCEPT: string.notificationPopup.actionText.ACCEPTED,
        DOCUMENT_REJECT: string.notificationPopup.actionText.REJECTED,
        EVENT_REJECT: string.notificationPopup.actionText.REJECTED,
        accept: string.notificationPopup.actionText.ACCEPTED,
        reject: string.notificationPopup.actionText.REJECTED,
    }

    /**
     * Request for fetching all @notifications
     */
    const handleFetchNotifications = async (userId, skip = -1, isFetchAll = false) => {
        setLoading(true)
        const offsetVal = skip > -1 ? skip : offset * GLOBAL_LIMIT
        const limit = isFetchAll ? GLOBAL_LIMIT * (GLOBAL_OFFSET + 1) : GLOBAL_LIMIT
        const notifications_data = await fetchNotifications({ userId, limit, offset: offsetVal })
        const allNotificaitons = offset > 0 && skip === -1 ? [...notifications, ...notifications_data] : notifications_data
        const unreadNotifications = filter(allNotificaitons, (notification) => !notification.isRead)
        setUnreadNotifications(unreadNotifications)
        setNotifications(allNotificaitons)
        setLoading(false)
    }

    useEffect(() => {
        handleFetchNotifications(user.id, 0, true)
    }, [])

    const handleReadNotification = async () => {
        await readAllNotifications({ user_id: user.id })
    }

    /**
     * Mark notification as read
     */
    const viewNotification = async (notification_id, project_id, container_id, event_type, project) => {
        await readNotification({ notification_id })
        if (event_type == 'view_user') {
            Router.push('/participant')
        } else if (project.archived != 1) {
            let selectedValuesJson = window.localStorage.getItem(project_id)
            if (selectedValuesJson) {
                let selectedVals = JSON.parse(selectedValuesJson)
                selectedVals.container_id = container_id
                window.localStorage.setItem(project_id, JSON.stringify(selectedVals))
            }
            Router.push('/event/' + project_id)
        }
    }

    const handleSetOffset = useCallback(() => {
        setOffset(offset + 1)
        GLOBAL_OFFSET = offset + 1
    }, [offset])

    const handleListScroll = useCallback(() => {
        const target = listRef.current
        if (!!target) {
            if (previousScroll < target.scrollTop && target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
                if (notifications.length % GLOBAL_LIMIT === 0) {
                    handleFetchNotifications(user.id)
                    handleSetOffset()
                }
            }
            setPreviousScroll(target.scrollTop)
        }
    }, [previousScroll])
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal notificationModal modal-lg notification-modal-width'>
            <ModalHeader
                toggle={() => {
                    handleReadNotification()
                    toggle()
                }}
                className='modal-header'
                cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold text-center' }}
            >
                {string.notificationPopup.titleText}
            </ModalHeader>
            <ModalBody className='modal-body'>
                {isLoading && <Loader />}
                <div className='dropdown-list user-notifications-list'>
                    <div ref={listRef} style={{ height: '100%', overflow: 'auto' }} onScroll={handleListScroll}>
                        {notifications?.map((notification, i) => {
                            notification.event_action = notification.event_type === 'accept' || notification.event_type == 'reject' ? 'ALERT' : notification.event_action
                            const event_img = notification?.event_action && notification.event_action.toLowerCase() + '_' + notification.event_type.toLowerCase()
                            const readStatus = notification.isRead ? 'read' : 'unread'
                            const { event_name, local_event_name, stationName } = notification?.project_event

                            let eventName = otherLanguage ? local_event_name || event_name : event_name

                            if (notification.event_type == 'view_user') {
                                eventName = `${notification.user?.username} (${notification.user?.organization.name}) viewed your profile`
                            }

                            return (
                                <a
                                    onClick={() => viewNotification(notification.id, notification.project_id, notification.project_event.container_id, notification.event_type, notification.project)}
                                    key={i}
                                    className={readStatus + ' dropdown-item d-flex align-items-center'}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className='mr-3'>
                                        {notification.event_type == 'view_user' ? (
                                            <div className='icon-circle'>
                                                <i class='fa fa-user-circle'></i>
                                            </div>
                                        ) : (
                                            <div className='icon-circle'>
                                                <img alt='notification-icon' src={`/static/img/${event_img}.png`} />{' '}
                                            </div>
                                        )}
                                    </div>
                                    <div className='w-100'>
                                        <div className='notificaiton-title block-title'>
                                            {notification.event_action != 'ALERT' && notification.event_type != 'accept' && notification.event_type != 'reject' && (
                                                <>
                                                    {notification.user?.username}
                                                    &nbsp;(
                                                    {notification.user?.organization.name})<span className='notificaiton-fontsize text-gray-700'> {actionText[notification.event_action]} </span>
                                                </>
                                            )}
                                            {(notification.event_type === 'accept' || notification.event_type === 'reject') && (
                                                <>
                                                    {string.participant.allParticipant}
                                                    <span className='notificaiton-fontsize text-gray-700'> {actionText[notification.event_type]} </span>
                                                </>
                                            )}
                                            {eventName}
                                            {notification.event_type === 'borderin' || notification.event_type === 'borderout' ? (
                                                <>
                                                    <span className='notificaiton-fontsize text-gray-700'>
                                                        &nbsp;
                                                        {string.notificationPopup.atLocTxt}
                                                        &nbsp;
                                                    </span>
                                                    {stationName}
                                                </>
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                        {notification.event_type !== 'view_user' && (
                                            <span className='notificaiton-fontsize text-gray-700'>
                                                {dynamicLanguageStringChange(string.notificationPopup.onItemIDTxt, notification.project ? JSON.parse(notification.project.custom_labels) : { item: 'Item' })}
                                                &nbsp;
                                                {notification?.item?.itemID}
                                                ,&nbsp;
                                                {string.notificationPopup.projecttxt}
                                                &nbsp;
                                                {notification.project?.name || ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className='small notificaiton-date text-gray-700'>{momentStaticAgo(notification.createdAt, '')}</div>
                                </a>
                            )
                        })}
                        {notifications.length === 0 && !isLoading && <p className='text-center'>{string.nonewnotificationfound}</p>}
                    </div>
                </div>
            </ModalBody>
        </Modal>
    )
}

export default NotificationModal
