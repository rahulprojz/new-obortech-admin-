import sendRequest from './sendRequest'
import { getQuery } from '../helpers'
import sendRequestWithFile from './sendRequestWithFile'

const BASE_PATH = '/api/v1/user'

export const addUser = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchUsers = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })

export const removeUser = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateUser = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const approveUser = (data) =>
    sendRequest(`${BASE_PATH}/approve`, {
        body: JSON.stringify(data),
    })

export const VerifyUser = (data) =>
    sendRequest(`${BASE_PATH}/verify`, {
        body: JSON.stringify(data),
    })

export const fetchUserById = ({ id }) =>
    sendRequest(`${BASE_PATH}/id/${id}`, {
        method: 'GET',
    })

export const fetchUserByUniqueId = ({ unique_id }) =>
    sendRequest(`${BASE_PATH}/uniqueId/${unique_id}`, {
        method: 'GET',
    })

export const updateUserProfile = (data) =>
    sendRequest(`${BASE_PATH}/profile/update`, {
        body: JSON.stringify(data),
    })

//Fetch purposes
export const fetchPurpose = () =>
    sendRequest(`${BASE_PATH}/fetchpurpose`, {
        method: 'GET',
    })

export const fetchUsersAll = () =>
    sendRequest(`${BASE_PATH}/fetchAllUsers`, {
        method: 'GET',
    })

export const fetchPdcUsers = (data) =>
    sendRequest(`${BASE_PATH}/fetchPdcUsers`, {
        body: JSON.stringify(data),
    })

export const updateUserLanguage = ({ id, code }) =>
    sendRequest(`${BASE_PATH}/changeLanguage/${id}`, {
        body: JSON.stringify({ code }),
    })

export const addPublicUser = (data) =>
    sendRequest(`${BASE_PATH}/addPublicUser`, {
        body: JSON.stringify(data),
    })

export const invalidateUserProfile = () =>
    sendRequest(`${BASE_PATH}/invalidate`, {
        body: JSON.stringify({}),
    })

export const sendApprovalRejectionEmail = (payload) =>
    sendRequest(`${BASE_PATH}/approval-rejection-email${getQuery(payload)}`, {
        method: 'GET',
    })

export const sendProfileEmail = (payload) =>
    sendRequest(`${BASE_PATH}/share-profile-email${getQuery(payload)}`, {
        method: 'GET',
    })

export const checkApprovedOrg = (approvedBy) =>
    sendRequest(`${BASE_PATH}/check-approved-org/${approvedBy}`, {
        method: 'GET',
    })

export const checkGithubDetails = () =>
    sendRequest(`${BASE_PATH}/github-details`, {
        method: 'GET',
    })

export const addGithubDetails = (data) =>
    sendRequest(`${BASE_PATH}/add-github-details`, {
        body: JSON.stringify(data),
    })

export const checkGithubUsername = (data) =>
    sendRequest(`${BASE_PATH}/check-github-username/${data.username}`, {
        method: 'GET',
    })