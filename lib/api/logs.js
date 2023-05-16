import { useQuery } from 'react-query'
import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/project-logs'
const FETCHLOCATIONLOG = 'project-location.log'
const FETCHLATESTSTATS = 'project-stats'

export const fetchLocationLogs = ({ container, project, item_id }) =>
    sendRequest(`${BASE_PATH}/location?item_id=${item_id}&project_id=${project}`, {
        method: 'GET',
    })

export const fetchTemperatureLogs = (data) =>
    sendRequest(`${BASE_PATH}/temperature?item_id=${data.projectSelections.item_id}&device_id=${data.projectSelections.device_id}&project_id=${data.project_id}&start_date=${data.start_date}&end_date=${data.end_date}`, {
        method: 'GET',
    })

export const fetchHumidityLogs = (data) =>
    sendRequest(`${BASE_PATH}/humidity?item_id=${data.projectSelections.item_id}&device_id=${data.projectSelections.device_id}&project_id=${data.project_id}&start_date=${data.start_date}&end_date=${data.end_date}`, {
        method: 'GET',
    })

export const fetchLatestStats = ({ item_id, project, device_id }) =>
    sendRequest(`${BASE_PATH}/latest-stats?item_id=${item_id}&project_id=${project}&device_id=${device_id}`, {
        method: 'GET',
    })

export const useQueryLocationLog = (props) => {
    return useQuery([FETCHLOCATIONLOG, props.project, props.container, props.item_id], () => fetchLocationLogs(props), {
        initialData: {
            code: null,
            data: {},
            message: '',
        },
    })
}

export const useQueryStatsLog = (props) => {
    return useQuery([FETCHLATESTSTATS, props.project, props.item_id, props.device_id], () => fetchLatestStats(props), {
        initialData: {
            code: null,
            data: {},
            message: '',
        },
    })
}
