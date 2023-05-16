import sendRequest from './sendRequest'
import { getQuery } from '../helpers'
const BASE_PATH = '/api/v1/device'

export const addDevice = (data) =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data),
    })

export const fetchDevices = (payload) =>
    sendRequest(`${BASE_PATH}${getQuery(payload)}`, {
        method: 'GET',
    })

export const removeDevice = (data) =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    })

export const updateDevice = (data) =>
    sendRequest(`${BASE_PATH}/update`, {
        body: JSON.stringify(data),
    })

export const fetchDeviceInterval = (data) =>
    sendRequest(`${BASE_PATH}/fetch-interval`, {
        body: JSON.stringify(data),
    })

export const fetchProjectDevice = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-device`, {
        body: JSON.stringify(data),
    })

export const fetchProjectEventDevice = (data) =>
    sendRequest(`${BASE_PATH}/fetch-project-event-device`, {
        body: JSON.stringify(data),
    })

export const updateIotDataOn = (deviceId) => {
    sendRequest(`${BASE_PATH}/iot-on`, {
        body: JSON.stringify({ id: deviceId }),
    })
}

export const updateIotDataOff = (deviceId) => {
    sendRequest(`${BASE_PATH}/iot-off`, {
        body: JSON.stringify({ id: deviceId }),
    })
}
