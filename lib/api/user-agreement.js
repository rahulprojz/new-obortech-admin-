import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/user-agreement'

export const addUserAgreement = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchUserAgreement = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })

export const fetchUserAgreementHash = () =>
    sendRequest(`${BASE_PATH}/getHash`, {
        method: 'GET',
    })