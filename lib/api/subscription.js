import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/subscription'

export const checkPlan = (key) =>
    sendRequest(`${BASE_PATH}/check-plan/${key}`, {
        method: 'GET',
    })

export const fetchDetails = (key) =>
    sendRequest(`${BASE_PATH}/details/${key}`, {
        method: 'GET',
    })
