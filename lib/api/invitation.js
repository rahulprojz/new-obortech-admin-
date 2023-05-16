import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/invitation'

export const fetchInvitations = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })
