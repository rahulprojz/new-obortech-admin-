import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/user-data-request'

export const addDataRequest = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchDataRequests = (data) =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data),
    })

export const fetchDataRequest = (data) =>
    sendRequest(`${BASE_PATH}/fetchOne`, {
        body: JSON.stringify(data),
    })

export const deleteDataRequest = (data) =>
    sendRequest(`${BASE_PATH}/delete`, {
        body: JSON.stringify(data),
    })

export const handleDeleteUserDataRequest = (data) =>
    sendRequest(`${BASE_PATH}/delete/by-user-id`, {
        body: JSON.stringify(data),
    })

export const changeRequestStatus = (data) =>
    sendRequest(`${BASE_PATH}/change-status`, {
        body: JSON.stringify(data),
    })
