// Load dependencies
const express = require('express')
const _ = require('lodash')
const string = require('../helpers/LanguageHelper')
const projectEventHelper = require('../helpers/project-event-helper.js')
const { hostAuth, userAuth, jwtAuth } = require('../middlewares')
const mongooseDB = require('../models/mangoose/index.model')

// Load MySQL Models
const db = require('../models')

const LocatoinLog = db.location_logs
const TemperatureLog = db.temperature_logs
const HumidityLog = db.humidity_logs
const SealingDetail = db.sealing_details
const ProjectRoad = db.project_roads
const Station = db.stations
const Project = db.projects
const TamperDetail = db.tamper_details
// const MProjectEvent = mongooseDB.project_event

// Define global variables
const router = express.Router()
const Op = db.Sequelize.Op

router.use(hostAuth)
router.use(jwtAuth)
router.use(userAuth)

// Fetch Project Logs
router.get('/location', async (req, res) => {
    const { project_id, item_id } = req.query
    const whereObj = { project_id }
    const isNotAdminRole = req.user.role_id != process.env.ROLE_ADMIN
    const isManagerRole = req.user.role_id == process.env.ROLE_MANAGER
    const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })

    if (item_id && item_id != 'undefined' && item_id != 'null') {
        whereObj.item_id = item_id
    } else if (isManagerRole && projectDetails ? projectDetails.user_id != req.user.id : isNotAdminRole) {
        const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, req.user.id, project_id)
        if (userManualEvents.length) {
            whereObj.item_id = { [Op.in]: userManualEvents.map((event) => parseInt(event.item_id)) }
        } else {
            return res.status(200).json({
                code: 1,
                data: {
                    locationlogs: [],
                    stations: [],
                },
            })
        }
    }

    try {
        // Locatoin logs
        const locationLogs = await LocatoinLog.findAll({
            attributes: ['latitude', 'longitude'],
            where: whereObj,
            order: [['id', 'ASC']],
        })

        // Project road stations
        const stations = await ProjectRoad.findAll({
            attributes: [],
            include: [
                {
                    model: Station,
                    attributes: ['name', 'radius', 'latitude', 'longitude'],
                },
            ],
            where: {
                project_id,
            },
            order: [['order', 'ASC']],
        })

        res.status(200).json({
            code: 1,
            message: string.apiResponses.logsFetchSuccess,
            data: {
                locationlogs: locationLogs,
                stations,
            },
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Fetch Temperature Logs
router.get('/temperature', async (req, res) => {
    let project_id = req.query.project_id
    let device_id = req.query.device_id
    let item_id = req.query.item_id
    //let projectSelections = req.query.projectSelections
    let start_date = req.query.start_date
    let end_date = req.query.end_date
    let whereObj = {
        project_id,
        device_id,
        item_id,
    }

    /* if (_.size(projectSelections)) {
        Object.keys(projectSelections).map((k) => {
            if (projectSelections[k]) {
                whereObj[k] = projectSelections[k]
            }
        })
    } */

    if (start_date != null && end_date != null) {
        whereObj.createdAt = {
            [Op.between]: [start_date, end_date],
        }
    }

    try {
        // Temperature logs
        const temperatureLogs = await TemperatureLog.findAll({
            attributes: ['temperature', 'createdAt'],
            where: whereObj,
            order: [['id', 'ASC']],
        })

        res.status(200).json({
            code: 1,
            message: string.apiResponses.logsFetchSuccess,
            data: temperatureLogs,
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Fetch Humidity Logs
router.get('/humidity', async (req, res) => {
    let project_id = req.query.project_id
    let device_id = req.query.device_id
    let item_id = req.query.item_id
    //let projectSelections = req.query.projectSelections
    let start_date = req.query.start_date
    let end_date = req.query.end_date

    let whereObj = {
        project_id,
        device_id,
        item_id,
    }
    /* if (_.size(projectSelections)) {
        Object.keys(projectSelections).map((k) => {
            if (projectSelections[k]) {
                whereObj[k] = projectSelections[k]
            }
        })
    } */

    if (start_date != null && end_date != null) {
        whereObj.createdAt = {
            [Op.between]: [start_date, end_date],
        }
    }

    try {
        // Humidity logs
        const humidityLogs = await HumidityLog.findAll({
            attributes: ['humidity', 'createdAt'],
            where: whereObj,
            order: [['id', 'ASC']],
        })

        res.status(200).json({
            code: 1,
            message: string.apiResponses.logsFetchSuccess,
            data: humidityLogs,
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Fetch Latest Temperature Logs
router.get('/latest-stats', async (req, res) => {
    const { project_id, item_id, device_id } = req.query
    const isNotAdminRole = req.user.role_id != process.env.ROLE_ADMIN
    const isManagerRole = req.user.role_id == process.env.ROLE_MANAGER
    const MProjectEvent = await mongooseDB.project_event(req.user.organization.blockchain_name)
    let latestTamperCount = null
    try {
        const whereObj = { project_id }
        const mWhereObj = { event_id: process.env.tempAlertEventId, project_id }
        let userManualEvents = []
        const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })
        const condition = isManagerRole && projectDetails ? projectDetails.user_id != req.user.id : isNotAdminRole
        if (condition) userManualEvents = await projectEventHelper.fetchUserManualEvents(req, req.user.id, project_id)
        if (item_id && item_id != 'undefined' && item_id != 'null') {
            whereObj.item_id = item_id
            mWhereObj.item_id = item_id
        } else if (condition) {
            if (userManualEvents.length) {
                whereObj.item_id = { [Op.in]: userManualEvents.map((event) => event.item_id) }
                mWhereObj.item_id = { $in: userManualEvents.map((event) => event.item_id) }
            } else {
                return res.status(200).json({
                    code: 1,
                    data: {
                        latestTemp: 0,
                        latestHum: 0,
                        sealingOpenCount: 0,
                        temp_alert_count: 0,
                        hum_alert_count: 0,
                        latestTamper: null,
                    },
                })
            }
        }
        if (device_id && device_id != 'undefined' && device_id != 'null') {
            whereObj.device_id = device_id
            mWhereObj.device_id = device_id
        } else if (condition) {
            if (userManualEvents.length) {
                const deviceId = []
                userManualEvents.map((event) => {
                    if (event.device_id) deviceId.push(event.device_id)
                })
                whereObj.device_id = { [Op.in]: deviceId }
                mWhereObj.device_id = { $in: deviceId }
            } else {
                return res.status(200).json({
                    code: 1,
                    data: {
                        latestTemp: 0,
                        latestHum: 0,
                        sealingOpenCount: 0,
                        temp_alert_count: 0,
                        hum_alert_count: 0,
                        latestTamper: null,
                    },
                })
            }
        }
        const tempAlertsCount = await MProjectEvent.countDocuments(mWhereObj).exec()

        mWhereObj.event_id = process.env.humidityAlertEventId
        const humAlertsCount = await MProjectEvent.countDocuments(mWhereObj).exec()
        const latestTemp = await TemperatureLog.findOne({
            attributes: ['temperature'],
            where: {
                project_id,
                item_id,
                device_id,
            },
            order: [['id', 'DESC']],
        })

        const latestHum = await HumidityLog.findOne({
            attributes: ['humidity'],
            where: {
                project_id,
                item_id,
                device_id,
            },
            order: [['id', 'DESC']],
        })

        if (whereObj.item_id) delete whereObj.item_id
        const sealingOpenCount = await SealingDetail.findOne({
            attributes: ['open_count'],
            where: whereObj,
            order: [['id', 'DESC']],
        })
        const latestTamper = await TamperDetail.findOne({
            attributes: ['status'],
            where: {
                project_id,
                // item_id: item_id,
                device_id,
            },
            order: [['id', 'DESC']],
        })
        if (latestTamper) {
            latestTamperCount = await TamperDetail.count({
                attributes: ['status'],
                where: {
                    project_id,
                    status: latestTamper.status,
                    // item_id: item_id,
                    device_id,
                },
                order: [['id', 'DESC']],
            })
        }

        res.status(200).json({
            code: 1,
            message: string.apiResponses.logsFetchSuccess,
            data: {
                latestTemp: latestTemp ? parseFloat(latestTemp.temperature).toFixed(1) : 0,
                latestHum: latestHum ? latestHum.humidity : 0,
                sealingOpenCount: sealingOpenCount ? sealingOpenCount.open_count : 0,
                temp_alert_count: tempAlertsCount,
                hum_alert_count: humAlertsCount,
                latestTamper: latestTamper ? latestTamper.status : null,
                latestTamperCount,
            },
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

module.exports = router
