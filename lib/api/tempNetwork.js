import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/temp-network'

export const fetchTempoNetworkEvents = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })
