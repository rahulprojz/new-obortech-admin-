import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/privacy-policy'

export const addPrivacyPolicy = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchPrivacyPolicy = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })
