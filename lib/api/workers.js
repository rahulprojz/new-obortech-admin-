import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/workers';

export const addWorker = data =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    });

export const fetchWorkers = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    });

export const removeWorker = data =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    });

export const updateWorker = data =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    });

export const fetchActiveVerifiedWorkers = () =>
    sendRequest(`${BASE_PATH}/fetch/verified`, {
        method: 'GET',
    });
