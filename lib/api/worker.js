import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/worker';

export const fetchWorkers = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    });