import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/security-questions'

export const fetchSecurityQuestions = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })
