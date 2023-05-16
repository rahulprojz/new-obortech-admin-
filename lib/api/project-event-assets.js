import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/project-event-assets'

export const fetchProjectEventAssets = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })


