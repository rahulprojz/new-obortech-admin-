import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/document-category'

export const addDocumentCategory = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchDocumentCategories = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchDocumentCategorieswithEvents = (payload) =>
    sendRequest(`${BASE_PATH}/fetch-with-events${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchDocumentCategoriesByPDC = (data) =>
    sendRequest(`${BASE_PATH}/fetch-document-by-pdc`, {
        body: JSON.stringify(data),
    })

export const fetchAllDocumentCategories = () =>
    sendRequest(`${BASE_PATH}/fetch-all`, {
        method: 'GET',
    })
export const removeDocumentCategory = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateDocumentCategory = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })
