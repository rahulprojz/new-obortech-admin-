import sendRequest from './sendRequest'
const BASE_PATH = '/api/v1/github'

export const isUserGitRepoCollaborator = (data) =>
    sendRequest(`${BASE_PATH}/repos/${data.owner}/${data.repo}/collaborator/${data.username}`, {
        method: 'GET',
    })

export const fetchGitRepoCollaborators = (data) =>
    sendRequest(`${BASE_PATH}/repos/${data.owner}/${data.repo}/collaborators`, {
        method: 'GET',
    })

export const fetchGitRepo = (data) =>
    sendRequest(`${BASE_PATH}/repos/${data.owner}/${data.repo}`, {
        method: 'GET',
    })

export const checkIfUserExists = (data) =>
    sendRequest(`${BASE_PATH}/users/${data.token.trim()}`, {
        method: 'GET',
    })

export const fetchGitUser = (data) =>
    sendRequest(`${BASE_PATH}/users/${data.username}`, {
        method: 'GET',
    })

export const fetchGitRepoInvitations = (data) =>
    sendRequest(`${BASE_PATH}/user/repository-invitations`, {
        method: 'GET',
    })

export const addGitRepoCollaborator = (data) =>
    sendRequest(`${BASE_PATH}/repos/${data.owner}/${data.repo}/collaborators/${data.username}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })

export const acceptGitRepoInvitation = (data) =>
    sendRequest(`${BASE_PATH}/user/repository-invitations/${data.invitationId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

export const rejectGitRepoInvitation = (data) =>
    sendRequest(`${BASE_PATH}/user/repository-invitations/${data.invitationId}`, {
        method: 'DELETE',
        body: JSON.stringify(data),
    })

export const updateGitHubAccess = (data, action) =>
    sendRequest(`${BASE_PATH}/access?action=${action}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })

export const fetchGitRepoAccessData = (data) =>
    sendRequest(`${BASE_PATH}/access/${data.proposal_name}`, {
        method: 'GET',
    })

export const updateGitRepoAccessData = (data) =>
    sendRequest(`${BASE_PATH}/access/${data.proposal_name}`, {
        method: 'PATCH',
    })