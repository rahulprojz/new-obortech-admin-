import { useQuery } from 'react-query'
import { filter } from 'lodash'
import sendRequest, { sendAbsoluteRequest } from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/project'
// Set Cron URL
let CRON_URL = 'http://localhost:4000/api/v1/cron'
if (process.env.SITE_URL == 'https://qa-login.obortech.io') {
    CRON_URL = 'https://qa-cron.obortech.io/api/v1/cron'
} else if (process.env.SITE_URL == 'https://uat-login.obortech.io') {
    CRON_URL = 'https://cron.obortech.io/api/v1/cron'
} else if (process.env.SITE_URL == 'https://st-login.obortech.io' || process.env.SITE_URL == 'https://login.obortech.io') {
    CRON_URL = 'https://cron.obortech.io/api/v1/cron'
}

const FETCHPROJECTDETAILS = 'project.project_details'
const FETCHPROJECT = 'project.project'
const FETCHPROJECTSELECTIONS = 'project.project_selections'
const FETCHPROJECTS = 'project.projects'
const FETCHGROUPS = 'project.GROUPS'
const FETCHTRUCKS = 'project.TRUCKS'
const FETCHCONTAINER = 'project.CONTAINER'
const FETCHITEMS = 'project.ITEMS'
const FETCHDEVICES = 'project.DEVICES'

export const addProject = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchProjects = () =>
    sendRequest(`${BASE_PATH}/fetch`, {
        method: 'GET',
    })

export const fetchProject = (data) =>
    sendRequest(`${BASE_PATH}/fetchOne`, {
        body: JSON.stringify(data),
    })

export const fetchProjectSelections = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-data`, {
        body: JSON.stringify(data),
    })

export const fetchProjectDetails = (data, options = {}) =>
    sendRequest(`${BASE_PATH}/fetch-project-details`, {
        body: JSON.stringify(data),
        ...options,
    })

export const fetchGroups = (data) =>
    sendRequest(`${BASE_PATH}/fetch-groups`, {
        body: JSON.stringify(data),
    })

export const fetchTrucks = (data) =>
    sendRequest(`${BASE_PATH}/fetch-trucks`, {
        body: JSON.stringify(data),
    })

export const fetchContainers = (data) =>
    sendRequest(`${BASE_PATH}/fetch-containers`, {
        body: JSON.stringify(data),
    })

export const fetchItems = (data) =>
    sendRequest(`${BASE_PATH}/fetch-items`, {
        body: JSON.stringify(data),
    })

export const fetchDevices = (data) =>
    sendRequest(`${BASE_PATH}/fetch-devices`, {
        body: JSON.stringify(data),
    })

export const removeProject = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const removetemplate = (data) =>
    sendRequest(`${BASE_PATH}/remove-template`, {
        body: JSON.stringify(data),
    })
export const restoreProject = (data) =>
    sendRequest(`${BASE_PATH}/restore`, {
        body: JSON.stringify(data),
    })

export const completeProject = (data) =>
    sendRequest(`${BASE_PATH}/complete`, {
        body: JSON.stringify(data),
    })

export const updateProject = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const startItemTracking = (data) =>
    sendAbsoluteRequest(`${CRON_URL}/start-item-tracking`, {
        body: JSON.stringify(data),
    })

export const stopTracking = (data) =>
    sendAbsoluteRequest(`${CRON_URL}/stop-tracking`, {
        body: JSON.stringify(data),
    })

export const fetchSidebarFolders = () =>
    sendRequest(`${BASE_PATH}/fetch-sidebar-folders`, {
        method: 'GET',
    })

export const addSidebarFolder = (data) =>
    sendRequest(`${BASE_PATH}/create-sidebar-folder`, {
        body: JSON.stringify(data),
    })

export const updateFolder = (data) =>
    sendRequest(`${BASE_PATH}/update-folder`, {
        body: JSON.stringify(data),
    })

export const updateSidebarPosition = (data) =>
    sendRequest(`${BASE_PATH}/update-sidebar-project-position`, {
        body: JSON.stringify(data),
    })

export const updateSidebarFolder = (data) =>
    sendRequest(`${BASE_PATH}/update-sidebar-folder`, {
        body: JSON.stringify(data),
    })

export const removeFolder = (data) =>
    sendRequest(`${BASE_PATH}/remove-sidebar-folder`, {
        body: JSON.stringify(data),
    })

export const assignProjectSidebar = (data) =>
    sendRequest(`${BASE_PATH}/assign-project-sidebar-folder`, {
        body: JSON.stringify(data),
    })

export const releaseProjectSidebar = (data) =>
    sendRequest(`${BASE_PATH}/remove-project-sidebar-folder`, {
        body: JSON.stringify(data),
    })

export const recentProject = (data) =>
    sendRequest(`${BASE_PATH}/recent-project`, {
        body: JSON.stringify(data),
    })

export const fetchProjectOnly = (payload) =>
    sendRequest(`${BASE_PATH}${getQuery(payload)}`, {
        method: 'GET',
    })
export const fetchSelectionProject = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-selections`, {
        body: JSON.stringify(data),
    })

export const fetchProjectRoads = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-roads`, {
        body: JSON.stringify(data),
    })

export const fetchAllProjectSelections = () =>
    sendRequest(`${BASE_PATH}/fetch-all-project-selections`, {
        method: 'GET',
    })

export const fetchNonDraftProjects = (payload) =>
    sendRequest(`${BASE_PATH}/non-draft${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchDraftProjects = (payload) =>
    sendRequest(`${BASE_PATH}/draft${getQuery(payload)}`, {
        method: 'GET',
    })

export const fetchArchived = () =>
    sendRequest(`${BASE_PATH}/fetch-archived`, {
        method: 'GET',
    })

const project_selections = async (project_id) => await fetchProjectSelections({ project_id })
const project_details = async (ids, options) => {
    if (ids) return await fetchProjectDetails({ ...ids }, options)
    return {}
}
const project = async (project_id) => await fetchProject({ project_id })
const projects = async () => {
    const allProjects = await fetchProjects()
    const project = filter(allProjects, (proj) => !proj.isDraft)
    const eventParticipantFilters = []
    const ProjectId = project.map((p) => {
        p.project_participants.map((val) => {
            eventParticipantFilters.push({ organization: val.organization, project_id: val.project_id })
        })
        return p.id
    })
    return { project, ProjectId, eventParticipantFilters }
}

export const useQueryProjectSelections = (project_id) => useQuery([FETCHPROJECTSELECTIONS, project_id], () => project_selections(project_id), { initialData: {}, enabled: !!project_id, keepPreviousData: true })
export const useQueryProjectDetails = (selections) => {
    const values = Object.values(selections).map((s) => s || 0)
    return useQuery(
        [FETCHPROJECTDETAILS, ...values],
        ({ signal }) => {
            return project_details(selections, { signal })
        },
        { initialData: {} },
    )
}
export const useQueryProject = (project_id) => useQuery([FETCHPROJECT, project_id], () => project(project_id), { initialData: {}, enabled: !!project_id })
export const useQueryProjects = (list) => useQuery([FETCHPROJECTS, 'watch-all'], () => projects(), { initialData: { project: [], ProjectId: [], eventParticipantFilters: [] }, enabled: !list })

export const useQueryGroup = (props = {}) => {
    return useQuery([FETCHGROUPS, props.project_id, props.elem_id, props.selections], () => fetchGroups(props), { initialData: { groups: [], selections: [] } })
}

export const useQueryTruck = (props = {}) => {
    return useQuery([FETCHTRUCKS, props.project_id, props.elem_id, props.selections], () => fetchTrucks(props), { initialData: [] })
}

export const useQueryContainer = (props = {}) => {
    return useQuery([FETCHCONTAINER, props.project_id, props.elem_id, props.selections], () => fetchContainers(props), { initialData: [] })
}

export const useQueryItem = (props = {}) => {
    return useQuery([FETCHITEMS, props.project_id, props.elem_id, props.selections], () => fetchItems(props), { initialData: [] })
}

export const useQueryDevice = (props = {}) => {
    return useQuery([FETCHDEVICES, props.project_id, props.elem_id, props.selections], () => fetchDevices(props), { initialData: [] })
}

export const fetchProjectList = () =>
    sendRequest(`${BASE_PATH}/fetch-project-list`, {
        method: 'GET',
    })
