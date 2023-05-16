import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/pdc-category'

export const addPdcCategory = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const updatePdcCategory = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchPdcCategory = (eventId) =>
    sendRequest(`${BASE_PATH}/fetch/${eventId}`, {
        method: 'GET',
    })

export const deletePdcCategory = (id) =>
    sendRequest(`${BASE_PATH}/delete-request/${id}`, {
        method: 'DELETE',
    })

export const isExistPdcCategory = (data) =>
    sendRequest(`${BASE_PATH}/exists`, {
        body: JSON.stringify(data),
    })

export const fetchCategoryOrg = (categoryId) =>
    sendRequest(`${BASE_PATH}/fetch-org/${categoryId}`, {
        method: 'GET',
    })

export const approvePDC = (categoryId, orgId, accessToken) =>
    sendRequest(`${BASE_PATH}/approve/${categoryId}/${orgId}`, {
        method: 'GET',
        headers: {
            Authorization: accessToken
        }
    })

export const approveDeletePDC = (orgId, id) =>
    sendRequest(`${BASE_PATH}/approve-to-delete/${orgId}/${id}`, {
        method: 'GET',
    })

export const fetchCategoryPDC = (eventId, pdcName) =>
    sendRequest(`${BASE_PATH}/fetch-pdc/${eventId}/${pdcName}`, {
        method: 'GET',
    })

export const fetchProjectPDC = (projectId) =>
    sendRequest(`${BASE_PATH}/fetch-project-pdc/${projectId}`, {
        method: 'GET',
    })

export const updateDefaultPdc = (data) =>
    sendRequest(`${BASE_PATH}/default-pdc`, {
        body: JSON.stringify(data),
    })

export const fetchPDCByEvent = (eventId) =>
    sendRequest(`${BASE_PATH}/fetch-pdc-by-event/${eventId}`, {
        method: 'GET',
    })

export const fetchEventsByPDC = (pdcid) =>
    sendRequest(`${BASE_PATH}/fetch-pdc-events/${pdcid}`, {
        method: 'GET',
    })

export const fetchEventByPDC = (eventId) =>
    sendRequest(`${BASE_PATH}/fetch-event-by-pdc/${eventId}`, {
        method: 'GET',
    })

export const checkPdcName = (data) =>
    sendRequest(`${BASE_PATH}/check-pdc-name`, {
        body: JSON.stringify(data),
    })
