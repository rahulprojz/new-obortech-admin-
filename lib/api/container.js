import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/container'

export const addContainer = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchContainers = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchContainerById = (data) =>
    sendRequest(`${BASE_PATH}/fetch-container`, {
        body: JSON.stringify(data),
    })

export const removeContainer = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateContainer = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchContainerProject = (data) =>
    sendRequest(`${BASE_PATH}/fetch-container-project`, {
        body: JSON.stringify(data),
    })

export const checkGroup1ManualCode = (data) =>
    sendRequest(`${BASE_PATH}/check-manual-code`, {
        body: JSON.stringify(data),
    })
