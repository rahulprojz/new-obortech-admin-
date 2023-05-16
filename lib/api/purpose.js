import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/purpose'

export const fetchAllPurpose = (data) =>
    sendRequest(`${BASE_PATH}`, {
        method: 'GET',
    })
