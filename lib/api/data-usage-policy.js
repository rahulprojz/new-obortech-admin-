import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/data-usage-policy'

export const fetchAllPolicies = () =>
    sendRequest(`${BASE_PATH}`, {
        method: 'GET',
    })


export const fetchSortAllPolicies = (payload) =>
sendRequest(`${BASE_PATH}${getQuery(payload)}`, {
    method: 'GET',
});

export const fetchOnePolicy = (data) =>
    sendRequest(`${BASE_PATH}/:{id}`, {
        method: 'GET',
    })

export const createPolicy = (data) =>
    sendRequest(`${BASE_PATH}`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const updatePolicy = (data) =>
    sendRequest(`${BASE_PATH}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

export const deletePolicy = (data) =>
    sendRequest(`${BASE_PATH}`, {
        method: 'DELETE',
        body: JSON.stringify(data),
    })
