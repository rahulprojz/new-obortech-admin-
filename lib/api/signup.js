import sendRequest from './sendRequest'
const BASE_PATH = '/api/v1/organization'

export const registerUser = (data) =>
    sendRequest(`${BASE_PATH}/register-user`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const existsByNameApi = (name) =>
    sendRequest(`${BASE_PATH}/existsByName?name=${name}`, {
        method: 'GET',
    })

export const existsByUsernameApi = (username) =>
    sendRequest(`${BASE_PATH}/existsByUsername?username=${username}`, {
        method: 'GET',
    })
