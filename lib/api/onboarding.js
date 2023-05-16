import sendRequest, { sendMVSRequest } from './sendRequest'
import sendRequestWithFile from './sendRequestWithFile'
const BASE_PATH = '/api/v1/onboarding'

export const verifyEmailIdApi = (data) =>
    sendRequest(`${BASE_PATH}/verify/email`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const addUser = (data) =>
    sendRequest(`${BASE_PATH}/addUser`, {
        body: JSON.stringify(data),
    })

export const checkEmail = (data) =>
    sendRequest(`${BASE_PATH}/check-email`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const checkUniqueId = (data) =>
    sendRequest(`${BASE_PATH}/check-unique-id`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const checkMobile = (data) =>
    sendRequest(`${BASE_PATH}/check-mobile`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const userVerification = (data, options = {}) =>
    sendMVSRequest(`/members`, {
        body: JSON.stringify(data),
        ...options,
        method: 'POST',
    })

export const organizationVerification = (data, options = {}) =>
    sendMVSRequest(`/organizations`, {
        body: JSON.stringify(data),
        ...options,
        method: 'POST',
    })

export const checkUserVerification = (memberId, options = {}) =>
    sendMVSRequest(`/members/${memberId}`, {
        ...options,
        method: 'GET',
    })

export const checkOrganizationVerification = (orgId, options = {}) =>
    sendMVSRequest(`/organizations/${orgId}`, {
        ...options,
        method: 'GET',
    })

export const uploadDocument = (data) =>
    sendRequestWithFile(`${BASE_PATH}/upload-document`, {
        body: data,
    })

export const createOnboardingRequest = (data) =>
    sendRequest(`${BASE_PATH}/create-onboarding-request`, {
        method: 'POST',
        body: JSON.stringify(data),
    })
