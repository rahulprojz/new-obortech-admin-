import sendRequest from './sendRequest'
const BASE_PATH = '/api/v1/notification'

export const defaultOptions = () =>
    sendRequest(`${BASE_PATH}/default-options`, {
        method: 'GET',
    })

export const saveSettings = (data) =>
    sendRequest(`${BASE_PATH}/save`, {
        body: JSON.stringify(data),
    })

export const fetchSettings = (data) =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data),
    })
