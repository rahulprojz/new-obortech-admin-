import sendRequest, { sendNetworkRequest } from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/smart-contract'

/* export const addDevice = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    }) */

export const fetchSmartContracts = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/${getQuery(payload)}`,
        {
            orgName: payload.orgName,
            userName: payload.userName,
            queryParams: getQuery(payload),
        },
        'SERVER',
        authToken,
        'GET',
    )

export const fetchSmartContractApprovals = (name, payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/approve/${name}${getQuery(payload)}`,
        {
            orgName: payload.orgName,
            userName: payload.userName,
            version: payload.version,
            queryParams: getQuery(payload),
        },
        'SERVER',
        authToken,
        'GET',
    )

export const fetchSmartContractComments = (name, payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/comment/${name}${getQuery(payload)}`,
        {
            orgName: payload.orgName,
            userName: payload.userName,
            version: payload.version,
            queryParams: getQuery(payload),
        },
        'SERVER',
        authToken,
        'GET',
    )

export const addSmartContractComment = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/comment`,
        {
            body: JSON.stringify(payload),
        },
        'SERVER',
        authToken,
        'POST',
    )

export const approveSmartContract = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/approve`,
        {
            body: JSON.stringify(payload),
        },
        'SERVER',
        authToken,
        'POST',
    )
export const addSmartContractProposal = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}`,
        {
            body: JSON.stringify(payload),
        },
        'SERVER',
        authToken,
        'POST',
    )

export const cancelSmartContractProposal = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/cancel`,
        {
            body: JSON.stringify(payload),
        },
        'SERVER',
        authToken,
        'PATCH',
    )

export const commitSmartContractProposal = (payload, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/commit`,
        {
            body: JSON.stringify(payload),
        },
        'SERVER',
        authToken,
        'POST',
    )

export const removeSmartContract = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateSmartContract = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchSmartContractInterval = (data) =>
    sendRequest(`${BASE_PATH}/fetch-interval`, {
        body: JSON.stringify(data),
    })

export const fetchProjectSmartContract = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-device`, {
        body: JSON.stringify(data),
    })

export const fetchProjectEventSmartContract = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-event-device`, {
        body: JSON.stringify(data),
    })
