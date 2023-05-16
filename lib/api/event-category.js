import { useQuery } from 'react-query'
import sendRequest, { sendNetworkRequest } from './sendRequest'
import { getQuery } from '../helpers'
import { fetchCategoryEvents } from './event'

const BASE_PATH = '/api/v1/event-category'
const FETCHNETWORKEVENTSDOC = 'project-event.network.event-document'
const BASE_URL = '/api/v1/events'

export const addEventCategory = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const updateEventCategory = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchEventCategories = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchCategorieswithEvents = (payload) =>
    sendRequest(`${BASE_PATH}/fetch-with-events${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchAllEventCategories = () =>
    sendRequest(`${BASE_PATH}/fetch-all`, {
        method: 'GET',
    })

export const fetchEventCategoriesByPDC = (data) =>
    sendRequest(`${BASE_PATH}/fetch-event-by-pdc`, {
        body: JSON.stringify(data),
    })

export const removeEventCategory = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

const fetchSelectedEvents = async (props) => {
    try {
        const { eventCategoryIds, documentCategoryIds, selectedProject, enabled } = props
        if (enabled) {
            let allCategoryEvents
            if (selectedProject) {
                allCategoryEvents = await fetchCategoryEvents({ documentCategoryIds, eventCategoryIds })
                const events = [].concat.apply([], allCategoryEvents?.eventCategory?.map((eventCat) => eventCat.events) || [])
                const documents = [].concat.apply([], allCategoryEvents?.documentCategory?.map((docCat) => docCat.events) || [])
                return { events, documents }
            }
        }
        return { events: [], documents: [] }
    } catch (err) {
        console.log(err)
        return { events: [], documents: [] }
    }
}

export const useQueryEventDoc = (event_categories = [], document_categories = [], user, orgList, categoryLoading, selectedProject) => {
    try {
        const eventCategoryIds = []
        const documentCategoryIds = []
        event_categories.map((event) => {
            eventCategoryIds.push(event.event_category_id)
        })
        document_categories.map((document) => {
            documentCategoryIds.push(document.document_category_id)
        })
        const eventsids = eventCategoryIds.join('.')
        const documentids = documentCategoryIds.join('.')
        const selectedOrg = orgList?.find(({ id }) => id === user?.organization_id)
        if (selectedOrg && Object.values(selectedOrg).length === 0) {
            return { events: [], documents: [] }
        }
        let enabled = false
        if (!!user && !categoryLoading) {
            enabled = true
        }
        return useQuery([FETCHNETWORKEVENTSDOC, eventsids, documentids], ({ meta }) => fetchSelectedEvents({ ...meta }), {
            notifyOnChangeProps: ['data', 'error'],
            initialData: { events: [], documents: [] },
            enabled,
            meta: {
                selectedProject,
                enabled,
                eventCategoryIds,
                documentCategoryIds,
            },
        })
    } catch (err) {
        console.log(err)
    }
}
