// Cron Helper
const moment = require('moment')
const GeoPoint = require('geopoint')
const mongoose = require('mongoose')
const { PolyUtil } = require('node-geometry-library')
const _ = require('lodash')
const db = require('../models')
const networkHelper = require('./network-helper.js')
const networkHooks = require('../hooks/network-hooks')
const NotificationHelper = require('./notification-helper.js')
const axios = require('axios')
const mdb = require('../models/mangoose/index.model')

const Events = db.events
const ProjectTempEvent = db.project_temp_events
const SealingDetail = db.sealing_details
const ProjectEventUser = db.project_event_users
const StationBorderInfo = db.station_border_info
const LocationLog = db.location_logs
const HumidityLog = db.humidity_logs
const TemperatureLog = db.temperature_logs
const DeviceApiLog = db.device_api_logs
const Project = db.projects
const { Op } = db.Sequelize

const minDistanceToSaveLog = 100
const { tempAlertEventId } = process.env
const { humidityAlertEventId } = process.env
const { sealOpenAlertEventId } = process.env
const { sealLockAlertEventId } = process.env
const { borderInEventId } = process.env
const { borderOutEventid } = process.env
const { ALERT_EVENTS_CATEGORY } = process.env

let CRON_URL = 'http://localhost:4000/api/v1/cron'
if (process.env.SITE_URL == 'https://qa-login.obortech.io') {
    CRON_URL = 'https://qa-cron.obortech.io/api/v1/cron'
} else if (process.env.SITE_URL == 'https://uat-login.obortech.io' || process.env.SITE_URL == 'https://st-login.obortech.io' || process.env.SITE_URL == 'https://login.obortech.io') {
    CRON_URL = 'https://cron.obortech.io/api/v1/cron'
}

const cronRestartApi = async () => {
    try {
        const headers = {
            'Content-Type': 'application/json',
        }
        const response = await axios.get(`${CRON_URL}/restart-cron`, headers)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

/*
    Save Device Logs

    This fucntion will capture the current location, temperarure
    humidity, ambience from device and save them for debugging purpose
*/
const saveDeviceLog = async (obj, project, device_name) => {
    try {
        await DeviceApiLog.create({
            project_id: project.id,
            device_name,
            latitude: parseFloat(obj.state.geo.lat),
            longitude: parseFloat(obj.state.geo.lng),
            address: obj.state.geo.address,
            provider: obj.state.geo.provider,
            temperature: parseFloat(obj.state.temperature.temp),
            humidity: parseFloat(obj.state.HUM),
            ambience: parseFloat(obj.state.AMB),
        })
    } catch (error) {
        console.error(`Error in saving device logs: ${error}`)
    }
}

/*
    Save Location Logs

    This fucntion will capture the current location from device
    and save it to show in analytics dashboard
*/
const saveLocationLogs = async (obj, project, selection_elements) => {
    try {
        const locationRow = await LocationLog.findOne({
            where: {
                project_id: project.id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                device_id: selection_elements.device_id,
            },
            order: [['id', 'DESC']],
            limit: 1,
        })

        if (locationRow) {
            const current_position = new GeoPoint(parseFloat(obj.state.geo.lat), parseFloat(obj.state.geo.lng))
            const last_postiion = new GeoPoint(parseFloat(locationRow.latitude), parseFloat(locationRow.longitude))
            const covered_distance = current_position.distanceTo(last_postiion, true) // In Km
            const covered_distance_meters = parseFloat(covered_distance).toFixed(2) * 1000 // Convert km into meters

            // If covered distance is greater than 100 meter
            if (Math.round(covered_distance_meters) > minDistanceToSaveLog) {
                await LocationLog.create({
                    project_id: project.id,
                    group_id: selection_elements.group_id,
                    truck_id: selection_elements.truck_id,
                    container_id: selection_elements.container_id,
                    item_id: selection_elements.item_id,
                    device_id: selection_elements.device_id,
                    latitude: parseFloat(obj.state.geo.lat),
                    longitude: parseFloat(obj.state.geo.lng),
                })
            }
        } else {
            await LocationLog.create({
                project_id: project.id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                device_id: selection_elements.device_id,
                latitude: parseFloat(obj.state.geo.lat),
                longitude: parseFloat(obj.state.geo.lng),
            })
        }
    } catch (error) {
        console.error(`Error in saving location logs: ${error}`)
    }
}

/*
    Save Temperature Logs

    This fucntion will capture the current temperature from device
    and save it to show in analytics dashboard
*/
const saveTemperatureLogs = async (obj, project, valuesObj, selection_elements) => {
    try {
        let min_temp_limit = parseFloat(valuesObj.min_temp)
        let max_temp_limit = parseFloat(valuesObj.max_temp)
        let current_temp = parseFloat(obj.state.temperature.temp)

        // If current temp is less than min limit or greater than max limit
        if (current_temp < min_temp_limit || current_temp > max_temp_limit) {
            await ProjectTempEvent.create({
                event_id: tempAlertEventId,
                project_id: project.id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                device_id: selection_elements.device_id,
                current_temp,
                isActive: 1,
            })
        }
        //Save temperature logs
        await TemperatureLog.create({
            project_id: project.id,
            group_id: selection_elements.group_id,
            truck_id: selection_elements.truck_id,
            container_id: selection_elements.container_id,
            item_id: selection_elements.item_id,
            device_id: selection_elements.device_id,
            temperature: current_temp,
        })
    } catch (error) {
        console.error(`Error in saving temperature logs: ${error}`)
    }
}

/*
    Save Humidity Logs

    This fucntion will capture the current humidity from device
    and save it to show in analytics dashboard
*/
const saveHumidityLogs = async (obj, project, valuesObj, selection_elements) => {
    try {
        let min_hum_limit = parseFloat(valuesObj.min_hum)
        let max_hum_limit = parseFloat(valuesObj.max_hum)
        let current_hum = parseFloat(obj.state.HUM)

        // If current humidity is less than min limit or greater than max limit
        if (current_hum < min_hum_limit || current_hum > max_hum_limit) {
            await ProjectTempEvent.create({
                event_id: humidityAlertEventId,
                project_id: project.id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                device_id: selection_elements.device_id,
                current_hum,
                isActive: 1,
            })
        }

        // Save humidity logs
        await HumidityLog.create({
            project_id: project.id,
            group_id: selection_elements.group_id,
            truck_id: selection_elements.truck_id,
            container_id: selection_elements.container_id,
            item_id: selection_elements.item_id,
            device_id: selection_elements.device_id,
            humidity: current_hum,
        })
    } catch (error) {
        console.error(`Error in saving humidity logs: ${error}`)
    }
}

/*
    Save Border Info

    This fucntion will capture the current location from
    device and save it to show in Border info on dashboard
*/
const saveBorderInfo = async (obj, project, user_id, selection_elements) => {
    try {
        let current_position = new GeoPoint(parseFloat(obj.state.geo.lat), parseFloat(obj.state.geo.lng))

        // Get and save truck's current position
        for (let i = 0; i < project.project_roads.length; i++) {
            const projectroad = project.project_roads[i].station
            const projectRoadPaths = JSON.parse(project.project_roads[i].paths)

            // Getting distance from project starting point to current position
            const starting_postiion = new GeoPoint(parseFloat(projectroad.latitude), parseFloat(projectroad.longitude))
            const covered_distance = current_position.distanceTo(starting_postiion, true) // In Km
            const covered_distance_meters = parseFloat(covered_distance).toFixed(2) * 1000 // Convert km into meters
            const position_radius = project.project_roads[i].radius || projectroad.radius

            const inCondition = projectRoadPaths.length ? PolyUtil.containsLocation({ lat, lng }, projectRoadPaths) : Math.round(covered_distance_meters) <= Math.round(position_radius)
            const outCondition = projectRoadPaths.length ? PolyUtil.containsLocation({ lat, lng }, projectRoadPaths) : Math.round(covered_distance_meters) > Math.round(position_radius)

            // If position is inside
            if (inCondition) {
                await _addInsideData(project.project_users, projectroad.id, user_id, project.id, covered_distance_meters, selection_elements)
            }

            // If position is outside
            if (outCondition) {
                await _addOutsideData(project.project_users, projectroad.id, user_id, project.id, covered_distance_meters, selection_elements)
            }
        }
    } catch (error) {
        console.error(`Error in saving device data: ${error}`)
    }
}

/*
    Generate Sealing Alert

    This fucntion will capture the current lock status from
    the device and generate an alert if the lock is opened or
    locked and also record the count of how many time lock is opened
    and closed for that project container
*/
const generateSealingAlert = async (obj, project, valuesObj, user_id, selection_elements) => {
    try {
        let lock_status = 'Locked'
        const prev_lock_status = 'Locked'
        let open_count = 0
        let close_count = 0
        const seal_alert_min = valuesObj.sealing_point

        // Get current seal status
        if (parseFloat(obj.state.AMB) > seal_alert_min) {
            lock_status = 'Opened'
        }

        // Get sealing
        const sealingdetail = await SealingDetail.findOne({
            where: {
                project_id: project.id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                device_id: selection_elements.device_id,
            },
            order: [['id', 'DESC']],
        })

        if (sealingdetail) {
            const prev_lock_status = sealingdetail.status
            open_count = sealingdetail.open_count
            close_count = sealingdetail.close_count

            if (prev_lock_status != lock_status) {
                if (lock_status == 'Opened') {
                    await _createProjectEvent(user_id, sealOpenAlertEventId, project.id, 0, project.project_users, selection_elements)

                    // Add sealing details
                    await SealingDetail.create({
                        event_id: sealOpenAlertEventId,
                        project_id: project.id,
                        group_id: selection_elements.group_id,
                        truck_id: selection_elements.truck_id,
                        container_id: selection_elements.container_id,
                        item_id: selection_elements.item_id,
                        device_id: selection_elements.device_id,
                        status: lock_status,
                        open_count: open_count + 1,
                        close_count,
                        is_active: 1,
                    })
                }

                if (lock_status == 'Locked') {
                    await _createProjectEvent(user_id, sealLockAlertEventId, project.id, 0, project.project_users, selection_elements)

                    // Add sealing details
                    await SealingDetail.create({
                        event_id: sealLockAlertEventId,
                        project_id: project.id,
                        group_id: selection_elements.group_id,
                        truck_id: selection_elements.truck_id,
                        container_id: selection_elements.container_id,
                        item_id: selection_elements.item_id,
                        device_id: selection_elements.device_id,
                        status: lock_status,
                        open_count,
                        close_count: close_count + 1,
                        is_active: 1,
                    })
                }
            }
        } else if (prev_lock_status != lock_status) {
            if (lock_status == 'Opened') {
                await _createProjectEvent(user_id, sealOpenAlertEventId, project.id, 0, project.project_users, selection_elements)

                // Add sealing details
                await SealingDetail.create({
                    event_id: sealOpenAlertEventId,
                    project_id: project.id,
                    group_id: selection_elements.group_id,
                    truck_id: selection_elements.truck_id,
                    container_id: selection_elements.container_id,
                    item_id: selection_elements.item_id,
                    device_id: selection_elements.device_id,
                    status: lock_status,
                    open_count: open_count + 1,
                    close_count,
                    is_active: 1,
                })
            }

            if (lock_status == 'Locked') {
                await _createProjectEvent(user_id, sealLockAlertEventId, project.id, 0, project.project_users, selection_elements)

                // Add sealing details
                await SealingDetail.create({
                    event_id: sealLockAlertEventId,
                    project_id: project.id,
                    group_id: selection_elements.group_id,
                    truck_id: selection_elements.truck_id,
                    container_id: selection_elements.container_id,
                    item_id: selection_elements.item_id,
                    device_id: selection_elements.device_id,
                    status: lock_status,
                    open_count,
                    close_count: close_count + 1,
                    is_active: 1,
                })
            }
        }
    } catch (error) {
        console.error(`Error in saving device data: ${error}`)
    }
}

/*
    Check current breaches and check against occurances

    This functions will check current temporary alerts again allowed occurances.
    If temp alerts are past allowed occurances then it will create actual project event entry.
*/
const verifyOccurancesAndAddToProjectEvent = async (project, user_id, event_id, allowed_occurances, selection_elements_devices, randomNum) => {
    const currentDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    console.log(`in verifyOccurancesAndAddToProjectEvent -- ${currentDateTime}`, 'project', project.id)
    try {
        let selection_elements = selection_elements_devices
        const whereCondition = {
            event_id,
            project_id: project.id,
            group_id: selection_elements.group_id,
            truck_id: selection_elements.truck_id,
            container_id: selection_elements.container_id,
            item_id: selection_elements.item_id,
            device_id: selection_elements.device_id,
        }

        const allEvents = await ProjectTempEvent.findAll({
            where: whereCondition,
        })

        if (allEvents.length > allowed_occurances) {
            const latestEvent = allEvents[allEvents.length - 1]
            if (latestEvent) {
                await _createProjectEvent(user_id, event_id, project.id, 0, project.project_users, selection_elements, latestEvent.current_temp, latestEvent.current_hum, randomNum)
            }
        }

        // Reset temp events for next interval
        await ProjectTempEvent.destroy({
            where: whereCondition,
        })
    } catch (err) {
        console.log(err)
    }
}

/*
    Add Border Inside Record

    This function will be used to insert border data
    in table when truck will go inside any position

*/
const _addInsideData = async (project_users, station_id, user_id, project_id, covered_distance, selection_elements) => {
    try {
        // Check if record already exists
        const stationrow = await StationBorderInfo.findOne({
            where: {
                station_id,
                project_id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
            },
            order: [['id', 'DESC']],
            limit: 1,
        })

        // Check if outside record exists for same road, then add new inside
        // Truck might have come second time to same location after existing
        if (!stationrow) {
            // Create new record if not exists
            await StationBorderInfo.create({
                station_id,
                project_id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                position: 'inside',
                travelled_distance: covered_distance,
            })

            // Check if event already exists
            const projectEventRow = await MProjectEvent.countDocuments({
                event_id: borderInEventId,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                project_id,
                road_id: station_id,
            }).exec()

            if (!projectEventRow) {
                await _createProjectEvent(user_id, borderInEventId, project_id, station_id, project_users, selection_elements)
            }
        } else if (stationrow && stationrow.position == 'outside') {
            // If outside record exists
            await StationBorderInfo.create({
                station_id,
                project_id,
                group_id: selection_elements.group_id,
                truck_id: selection_elements.truck_id,
                container_id: selection_elements.container_id,
                item_id: selection_elements.item_id,
                position: 'inside',
                travelled_distance: covered_distance,
            })

            // Create border event
            await _createProjectEvent(user_id, borderInEventId, project_id, station_id, project_users, selection_elements)
        }
    } catch (err) {
        console.log({ error: err.message || err.toString() })
    }
}

/*
    Add Border Outside Record

    This function will be used to insert border data
    in table when truck will go outside of any position
*/
const _addOutsideData = async (project_users, station_id, user_id, project_id, covered_distance, selection_elements) => {
    // Check if inside record exists for this position
    const insideposrow = await StationBorderInfo.findOne({
        where: {
            station_id,
            project_id,
            group_id: selection_elements.group_id,
            truck_id: selection_elements.truck_id,
            container_id: selection_elements.container_id,
            item_id: selection_elements.item_id,
        },
        order: [['id', 'DESC']],
        limit: 1,
    })

    // If latest record is for border inside
    if (insideposrow && insideposrow.position == 'inside') {
        // If inside record exists
        await StationBorderInfo.create({
            station_id,
            project_id,
            group_id: selection_elements.group_id,
            truck_id: selection_elements.truck_id,
            container_id: selection_elements.container_id,
            item_id: selection_elements.item_id,
            position: 'outside',
            travelled_distance: covered_distance,
        })

        // Create border event
        await _createProjectEvent(user_id, borderOutEventid, project_id, station_id, project_users, selection_elements)
    }
}

// Create project event
const _createProjectEvent = async (user_id, event_id, project_id, station_id, project_users, selection_elements, current_temp, current_hum, randomNum) => {
    try {
        const MProjectEvent = await mdb.project_event('obortech')
        let currentDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        const { group_id, truck_id, container_id, item_id, device_id, groupName, truckName, containerName, itemName, deviceName, deviceTag } = selection_elements
        if (randomNum) {
            const datetime = moment(new Date()).format('YYYY-MM-DD HH:mm')
            currentDateTime = `${datetime}:${randomNum}`
        }
        // get current event name
        const event = await Events.findOne({
            attributes: ['eventName', 'mongolianName'],
            where: {
                uniqId: event_id,
            },
        })

        // Project data
        const project = await Project.findByPk(parseInt(project_id))

        const bulkEntries = []
        project_users.map((pUser) => {
            if (pUser.user.role_id != process.env.ROLE_PUBLIC_USER) {
                bulkEntries.push({
                    organization_id: pUser.user.organization_id,
                    user_id: pUser.user_id,
                    created_by: process.env.ADMIN_USER_ID,
                    // is_parent_event: true,
                })
            }
        })
        const event_data = {
            event_id,
            event_name: event.eventName,
            local_event_name: event.mongolianName,
            event_submission_id: networkHooks._generateUniqId(),
            pdc_id: project.pdc_name,
            project_id: parseInt(project_id),
            group_id,
            truck_id,
            container_id,
            item_id,
            device_id,
            road_id: parseInt(station_id),
            current_temp: current_temp || 0,
            current_hum: current_hum || 0,
            isActive: 1,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
            _id: new mongoose.Types.ObjectId(),
            projectName: project.name,
            groupName,
            truckName,
            containerName,
            itemName,
            deviceName,
            deviceTag,
            event_type: 'event',
            event_category_id: ALERT_EVENTS_CATEGORY,
            viewUsers: bulkEntries,
        }

        const projectEvent = await MProjectEvent.create(event_data)

        // These events are excluded from the notification popup
        await NotificationHelper.notify({ project_event_id: projectEvent.event_submission_id, project_id, item_id: selection_elements.item_id, event_id: event_id, event_type: 'event', event_action: 'ALERT', session_user: 0, itemName: projectEvent.itemName, event_name: projectEvent.event_name })

        // Send event to network
        if (process.env.dev != 'true') {
            const event_json = {
                event_id,
                user_id,
                project_id,
                item_id: item_id,
                project_event_id: projectEvent._id,
                event_type: 'event',
                station_id,
            }
            await networkHelper.addEventSubmission(event_json)
        }
        // }
    } catch (err) {
        console.log(err)
    }
}

exports.saveDeviceLog = saveDeviceLog
exports.saveTemperatureLogs = saveTemperatureLogs
exports.saveHumidityLogs = saveHumidityLogs
exports.saveLocationLogs = saveLocationLogs
exports.saveBorderInfo = saveBorderInfo
exports.generateSealingAlert = generateSealingAlert
exports.verifyOccurancesAndAddToProjectEvent = verifyOccurancesAndAddToProjectEvent
exports.cronRestartApi = cronRestartApi
