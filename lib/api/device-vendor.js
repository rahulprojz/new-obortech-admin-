import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/device-vendor';

export const addDeviceVendor = data =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    });

export const fetchDeviceVendors = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    });

export const removeDeviceVendor = data =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    });

export const updateDeviceVendor = data =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    });
