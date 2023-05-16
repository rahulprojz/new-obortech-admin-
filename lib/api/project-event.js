import { useQuery } from 'react-query'
import sendRequest from './sendRequest'
import sendRequestWithFile from './sendRequestWithFile'

const BASE_PATH = '/api/v1/project-event'

export const addProjectEvent = (data) =>
    sendRequestWithFile(`${BASE_PATH}`, {
        body: data,
    })

export const allowEventSubmission = (data) =>
    sendRequest(`${BASE_PATH}/allow-event-submission`, {
        body: JSON.stringify(data),
    })

export const fetchUnseenEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-unseen-events`, {
        body: JSON.stringify(data),
    })

export const fetchProjectEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data),
    })

export const fetchProjectSubEventsMongoose = (data) =>
    sendRequest(`${BASE_PATH}/${data.event_submission_id}/project-sub-events`, {
        method: 'GET',
    })

export const fetchUserManualEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-user-manual-events`, {
        body: JSON.stringify(data),
    })

export const fetchPDCEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-events-for-pdc`, {
        body: JSON.stringify(data),
    })

export const fetchImageBase = (data) =>
    sendRequest(`${BASE_PATH}/fetchBaseImage`, {
        body: JSON.stringify(data),
    })

export const fetchProjectDocuments = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-documents`, {
        body: JSON.stringify(data),
    })

export const addProjectEventComment = (data) =>
    sendRequest(`${BASE_PATH}/${data.event_submission_id}/comment`, {
        body: JSON.stringify(data),
    })

export const handleUserAction = (data) =>
    sendRequest(`${BASE_PATH}/${data.project_event_id}?action=${data.user_action}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

export const seenProjectEventDocument = (data) =>
    sendRequest(`${BASE_PATH}/seen-document`, {
        body: JSON.stringify(data),
    })

export const removeProjectEvent = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateProjectComment = (data) =>
    sendRequest(`${BASE_PATH}/view_comment`, {
        body: JSON.stringify(data),
    })

export const fetchProjectViewAcceptOrg = (data) =>
    sendRequest(`${BASE_PATH}/fetch-view-accept-orgs`, {
        body: JSON.stringify(data),
    })

// export const fetchProjectUserEventList = (data) =>
//     sendRequest(`${BASE_PATH}/fetch-puser-events-list`, {
//         body: JSON.stringify(data),
//     })

export const fetchUserAllEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-all-events`, {
        body: JSON.stringify(data),
    })
export const fetchItemPublicProjectEvents = (data) =>
    sendRequest(`${BASE_PATH}/item-public-project-events`, {
        body: JSON.stringify(data),
    })

export const fetchProjectAcceptUsers = (data) =>
    sendRequest(`${BASE_PATH}/fetch-accept-user-list`, {
        body: JSON.stringify(data),
    })

export const fetchHiddenProjectEvents = () => sendRequest(`${BASE_PATH}/fetch-hidden-project-event`, {})

export const updateHiddenProjectEvents = (data) =>
    sendRequest(`${BASE_PATH}/save-hidden-project-events`, {
        body: JSON.stringify(data),
    })
