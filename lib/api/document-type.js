import sendRequest from "./sendRequest";
import { getQuery } from '../helpers'

const BASE_PATH = "/api/v1/document-type";

export const getAllDocumentTypes = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    });

export const getAllDocumentTypesById = (id) =>
    sendRequest(`${BASE_PATH}/fetch/${id}`, {
        method: 'GET',
    });

export const addDocumentTypeApi = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data)
    });

export const updateDocumentTypeApi = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data)
    });

export const removeDocumentTypeApi = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data)
    });