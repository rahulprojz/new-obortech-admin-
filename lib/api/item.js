import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/item'

export const addItem = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const updateItem = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchItems = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchItem = (data) =>
    sendRequest(`${BASE_PATH}/fetch-item`, {
        body: JSON.stringify(data),
    })

export const removeItem = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const addItemToProject = (data) =>
    sendRequest(`${BASE_PATH}/add-project-item`, {
        body: JSON.stringify(data),
    })

export const updateItemDevice = (data) =>
    sendRequest(`${BASE_PATH}/update-item-device`, {
        body: JSON.stringify(data),
    })

export const fetchItemDevice = (data) =>
    sendRequest(`${BASE_PATH}/fetch-item-device`, {
        body: JSON.stringify(data),
    })

export const fetchItemProject = (data) =>
    sendRequest(`${BASE_PATH}/fetch-item-project`, {
        body: JSON.stringify(data),
    })

export const trackItem = (code) =>
    sendRequest(`${BASE_PATH}/track-item/${getQuery(code)}`, {
        method: 'GET',
    })

export const fetchItemsProject = (data) =>
    sendRequest(`${BASE_PATH}/fetch-items-project`, {
        body: JSON.stringify(data),
    })

export const checkQrCode = (data) =>
    sendRequest(`${BASE_PATH}/check-qr-code`, {
        body: JSON.stringify(data),
    })

export const getItemCode = (payload) =>
    sendRequest(`${BASE_PATH}/code${getQuery(payload)}`, {
        method: 'GET',
    })
