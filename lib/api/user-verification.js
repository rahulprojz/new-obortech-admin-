import sendRequest from './sendRequest'
const BASE_PATH = '/api/v1/user-verification'

export const authVerifyStepOne = (data) =>
    sendRequest(`${BASE_PATH}/authVerifyStepOne`, {
        body: JSON.stringify(data),
    })

export const authVerifyStepTwo = (data) =>
    sendRequest(`${BASE_PATH}/authVerifyStepTwo`, {
        body: JSON.stringify(data),
    })

export const authLogin = (data) =>
    sendRequest(`${BASE_PATH}/authLogin`, {
        body: JSON.stringify(data),
    })

export const verifyToken = (data) =>
    sendRequest(`${BASE_PATH}/verifyToken`, {
        body: JSON.stringify(data),
    })
