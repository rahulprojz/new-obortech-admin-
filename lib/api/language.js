import sendRequest from './sendRequest'
const BASE_PATH = '/api/v1/language'

export const fetchLanguages = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })

export const updateLanguage = (id) =>
    sendRequest(`${BASE_PATH}/fetch/${id}`, {
        method: 'GET',
    })

export const getLanguage = (code) =>
    sendRequest(`${BASE_PATH}/${code}`, {
        method: 'GET',
    })
