import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/integrity'

export const checkIntegrity = (payload) =>
    sendRequest(`${BASE_PATH}/check-integrity`, {
        body: JSON.stringify(payload),
    })
