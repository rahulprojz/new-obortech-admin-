import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/user-titles';

export const getAllTitlesApi = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    }
)

export const addTitlesApi = data =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data)
    }
)

export const updateTitlesApi = data =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data)
    }
)

export const removeTitlesApi = data =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data)
    }
)
