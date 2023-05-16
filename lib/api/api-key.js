import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/api-key';

export const saveAPICredentials = data =>
    sendRequest(`${BASE_PATH}/save`, {
        body: JSON.stringify(data),
    });

export const fetchAPICredentials = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    });
