import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/types';

export const getAllTypesApi = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    }
)

export const addTypesApi = data =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data)
    }
)

export const updateTypesApi = data =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data)
    }
)

export const removeTypesApi = data =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data)
    }
)

export const fetchSelectedDocumentTypes = id =>
    sendRequest(`${BASE_PATH}/fetch-doc/${id}`, {
        method: 'GET',
    }
)