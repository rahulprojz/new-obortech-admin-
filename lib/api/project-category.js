import { useQueries, useQuery } from 'react-query'
import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/project-category'
const FETCHCATEGORIESEVENTS = 'project-categories.events'
const FETCHCATEGORIESDOCUMENTS = 'project-categories.documents'

export const addProjectCategory = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const addProjectEventCategory = (data) =>
    sendRequest(`${BASE_PATH}/addProjectEventCategory`, {
        body: JSON.stringify(data),
    })

export const addProjectDocumentCategory = (data) =>
    sendRequest(`${BASE_PATH}/addProjectDocumentCategory`, {
        body: JSON.stringify(data),
    })

export const addProjectParticipants = (data) =>
    sendRequest(`${BASE_PATH}/addProjectparticipantCategory`, {
        body: JSON.stringify(data),
    })

export const fetchProjectCategories = (payload) =>
    sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchProjectOrgCategories = () =>
    sendRequest(`${BASE_PATH}/fetch-categories`, {
        method: 'GET',
    })

export const fetchProjectDocumentCategories = (data) =>
    sendRequest(`${BASE_PATH}/fetchProjectDocumentCategories`, {
        body: JSON.stringify(data),
    })

export const fetchProjectEventCategories = (data) =>
    sendRequest(`${BASE_PATH}/fetchProjectEventCategories`, {
        body: JSON.stringify(data),
    })

export const removeProjectCategory = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const removeProjectEventCategory = (data) =>
    sendRequest(`${BASE_PATH}/removeProjectEventCategory`, {
        body: JSON.stringify(data),
    })

export const removeProjectDocumentCategory = (data) =>
    sendRequest(`${BASE_PATH}/removeProjectDocumentCategory`, {
        body: JSON.stringify(data),
    })

export const removeProjectParticipantCategory = (data) =>
    sendRequest(`${BASE_PATH}/removeProjectParticipantCategory`, {
        body: JSON.stringify(data),
    })

export const updateProjectCategory = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchProjectDocumentTypes = (id) =>
    sendRequest(`${BASE_PATH}/fetchByProject/${id}`, {
        method: 'GET',
    })

export const fetchProjectPDCList = (id) =>
    sendRequest(`${BASE_PATH}/fetchPDC/${id}`, {
        method: 'GET',
    })

export const fetchEventDocuments = (project_category_id) =>
    sendRequest(`${BASE_PATH}/fetch-event-document/${project_category_id}`, {
        method: 'GET',
    })

const eventCategories = async (project_category_id) => {
    if (project_category_id)
        return await fetchProjectEventCategories({
            project_category_id: project_category_id || 0,
        })
    return []
}
const documentCategories = async (project_category_id) => {
    if (project_category_id)
        return await fetchProjectDocumentCategories({
            project_category_id: project_category_id || 0,
        })
    return []
}

export const useQuerycategories = (project_category_id) =>
    useQueries([
        { queryKey: [FETCHCATEGORIESEVENTS, project_category_id], queryFn: () => eventCategories(project_category_id), initialData: [], enabled: !!project_category_id },
        { queryKey: [FETCHCATEGORIESDOCUMENTS, project_category_id], queryFn: () => documentCategories(project_category_id), initialData: [], enabled: !!project_category_id },
    ])

export const useQueryDocumentCategories = (project_category_id) => useQuery([FETCHCATEGORIESDOCUMENTS, project_category_id], () => documentCategories(project_category_id), { initialData: [] })
