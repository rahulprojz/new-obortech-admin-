import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/org-approval'

export const fetchApprovals = (orgId) =>
    sendRequest(`${BASE_PATH}/fetch/${orgId}`, {
        method: 'GET',
    })

export const approveOrg = (data) =>
    sendRequest(`${BASE_PATH}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
    })
