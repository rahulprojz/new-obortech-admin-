const BASE_PATH = '/api/v1/organization'
import sendRequest from './sendRequest'
import sendRequestWithFile from './sendRequestWithFile'
import { getQuery } from '../helpers'
import { useQuery } from 'react-query'

const FETCHORGANIZATION = 'orgenization.fetch-org'

export const fetchOrgs = (payload) =>
    sendRequest(`${BASE_PATH}/fetchOrgs${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchVerifiedOrg = () =>
    sendRequest(`${BASE_PATH}/fetchVerifiedOrg`, {
        method: 'GET',
    })

export const getOrg = (data) =>
    sendRequest(`${BASE_PATH}/getorg`, {
        body: JSON.stringify(data),
    })

export const getUserOrg = (data) =>
    sendRequest(`${BASE_PATH}/get-user-org`, {
        body: JSON.stringify(data),
    })

export const removeOrgs = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateOrganizationCCP = (data) =>
    sendRequest(`${BASE_PATH}/update-org`, {
        body: JSON.stringify(data),
    })

export const updateOrganization = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const approveOrgs = (data) =>
    sendRequest(`${BASE_PATH}/approve`, {
        body: JSON.stringify(data),
    })

export const addOrganization = (data) =>
    sendRequestWithFile(`${BASE_PATH}/add`, {
        body: data,
    })

export const inviteUser = (data) =>
    sendRequest(`${BASE_PATH}/invite-user`, {
        body: JSON.stringify(data),
    })

export const resendInviteUser = (data) =>
    sendRequest(`${BASE_PATH}/resend-invite-user`, {
        body: JSON.stringify(data),
    })

export const inviteOrganization = (data) =>
    sendRequest(`${BASE_PATH}/invite-organization`, {
        body: JSON.stringify(data),
    })

export const resendInviteOrganization = (data) =>
    sendRequest(`${BASE_PATH}/resend-invite-organization`, {
        body: JSON.stringify(data),
    })

export const inviteRemove = (data) =>
    sendRequest(`${BASE_PATH}/invite-remove`, {
        body: JSON.stringify(data),
    })

export const getInvitation = (data) =>
    sendRequest(`${BASE_PATH}/fetch-invite`, {
        body: JSON.stringify(data),
    })

export const getApprovers = (data) =>
    sendRequest(`${BASE_PATH}/get-approvers`, {
        body: JSON.stringify(data),
    })

export const isApprovedByOrg = () =>
    sendRequest(`${BASE_PATH}/isApprovedByOrg`, {
        method: 'GET',
    })

export const fetchOrgType = () =>
    sendRequest(`${BASE_PATH}/fetchOrgType`, {
        method: 'GET',
    })

export const fetchProjectParticipantCategory = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-participant-category`, {
        body: JSON.stringify(data),
    })

export const checkOrganizationExists = (data) =>
    sendRequest(`${BASE_PATH}/existsByStateId`, {
        body: JSON.stringify(data),
    })
export const fetchCategoryParticipants = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-participant-categories`, {
        body: JSON.stringify(data),
    })

/**
 * This API check if an Name is Available for Organization.
 * @param {String} data  The name of the Organization to check availability for.
 */
export const checkOrgNameIsAvailable = (data) =>
    sendRequest(`${BASE_PATH}/org-isvalid`, {
        body: JSON.stringify(data),
    })

export const useQueryOrgList = () => useQuery([FETCHORGANIZATION, 'org-list'], fetchOrgs, { initialData: [] })

export const fetchOrgsByCategory = (data) =>
    sendRequest(`${BASE_PATH}/fetchOrgsByCategory`, {
        body: JSON.stringify(data),
    })