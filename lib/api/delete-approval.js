import sendRequest from './sendRequest'
import { getQuery } from '../helpers'
const BASE_PATH = '/api/v1'

export const deleteApproval = (data) =>
    sendRequest(`${BASE_PATH}/delete-approval`, {
        body: JSON.stringify(data),
    })

export const deleteApprovalVerify = (data) =>
    sendRequest(`${BASE_PATH}/delete-approval/verify`, {
        body: JSON.stringify(data),
    })