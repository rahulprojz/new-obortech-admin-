import { useQuery } from 'react-query'
import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/event'
const FETCHSYSTEMEVENTS = 'events.event'

export const addEvent = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data),
    })

export const fetchAlertEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-alert-events`, {
        method: 'GET',
    })

export const deleteEvent = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateEvent = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchCategoryEvents = (data) =>
    sendRequest(`${BASE_PATH}/fetch-category-events`, {
        body: JSON.stringify(data),
    })

export const checkEventNameValid = (data) =>
    sendRequest(`${BASE_PATH}/isvalid-event-name`, {
        body: JSON.stringify(data),
    })

export const useQueryFetchSystemEvents = () => useQuery([FETCHSYSTEMEVENTS, 'system-events'], fetchEvents, { initialData: [] })
