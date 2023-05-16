import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/user-security-answers'

export const addUserSecurityAnswers = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchUserSecurityAnswers = (data) =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data),
    })
