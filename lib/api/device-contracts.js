import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/device-contract'

export const fetchDetails = (key) =>
    sendRequest(`${BASE_PATH}/detail/${key}`, {
        method: 'GET',
    })
