import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/create-form'

export const fetchFormData = (id) =>
    sendRequest(`${BASE_PATH}/${id}`, {
        method: 'GET',
    })

export const getForm = (id) =>
    sendRequest(`${BASE_PATH}/get-form/${id}`, {
        method: 'GET',
    })

export const addFormData = (data) =>
    sendRequest(`${BASE_PATH}`, {
        body: JSON.stringify(data),
    })

export const fetchFormListByUserIdRequest = (id) =>
    sendRequest(`${BASE_PATH}/fetch-list/${id}`, {
        method: 'GET',
    })

export const updateFormData = (data) =>
    sendRequest(`${BASE_PATH}/${data.id}`, {
        body: JSON.stringify(data),
    })

export const deleteFormData = (data) =>
    sendRequest(`${BASE_PATH}/remove/${data.id}`, {
        body: JSON.stringify(data),
    })
