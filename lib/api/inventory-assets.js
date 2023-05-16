import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/inventory-assets'

export const addAssets = (data) =>
    sendRequest(`${BASE_PATH}/add-assets`, {
        body: JSON.stringify(data),
    })

export const updateAssets = (data) =>
    sendRequest(`${BASE_PATH}/update-assets`, {
        // method: 'PATCH',
        body: JSON.stringify(data),
    })

export const fetchAssets = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const removeAssets = (id) =>
    sendRequest(`${BASE_PATH}/remove-assets/${id}`, {
        method: 'GET',
    })

export const checkAssetCode = (data) =>
    sendRequest(`${BASE_PATH}/check-asset-code`, {
        body: JSON.stringify(data),
    })
