import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/notification'

export const fetchNotifications = (data) =>
    sendRequest(`${BASE_PATH}/fetch-notifications`, {
        body: JSON.stringify(data),
    })

export const readNotification = (data) =>
    sendRequest(`${BASE_PATH}/read-notification`, {
        body: JSON.stringify(data),
    })

export const readAllNotifications = (data) =>
    sendRequest(`${BASE_PATH}/read-all-notifications`, {
        body: JSON.stringify(data),
    })

export const fetchUnreadNotificationCount = (data) =>
    sendRequest(`${BASE_PATH}/fetch-unread-count`, {
        body: JSON.stringify(data),
    })
export const notificationViewUser = (data) =>
    sendRequest(`${BASE_PATH}/notification-view-user`, {
        body: JSON.stringify(data),
    })
