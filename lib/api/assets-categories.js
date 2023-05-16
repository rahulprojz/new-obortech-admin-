import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/assets-categories'

export const createCategory = (data) =>
    sendRequest(`${BASE_PATH}/create-category`, {
        body: JSON.stringify(data),
    })

export const updateCategory = (data) =>
    sendRequest(`${BASE_PATH}/update-category`, {
        // method: 'PATCH',
        body: JSON.stringify(data),
    })

export const fetchCategory = (payload) =>
    sendRequest(`${BASE_PATH}/fetch-category${getQuery(payload)}`, {
        method: 'GET',
    })

export const deleteCategory = (id) =>
    sendRequest(`${BASE_PATH}/remove-category/${id}`, {
        method: 'POST',
    })
