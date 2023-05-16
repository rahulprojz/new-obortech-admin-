// Load dependencies
const express = require('express')
const _ = require('lodash')
const string = require('../helpers/LanguageHelper')
// Load MySQL Models
const db = require('../models')

const Device = db.devices
const DeviceVendor = db.device_vendors
const { Op } = db.Sequelize
const { sequelize } = db
const ProjectSelection = db.project_selections
const SelectionGroups = db.selection_groups
const SelectionDevice = db.selection_devices
const SelectionItems = db.selection_items
const SelectionContainers = db.selection_containers
const SelectionTrucks = db.selection_trucks
const Groups = db.groups
const Items = db.items
const Containers = db.containers
const Trucks = db.trucks
const { projects } = db
const { hostAuth, userAuth, jwtAuth } = require('../middlewares')

// Define global variables
const router = express.Router()

router.use(hostAuth)

// Fetch Devices code
router.get('/', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            include: [
                {
                    model: DeviceVendor,
                },
                {
                    model: SelectionDevice,
                    include: [
                        {
                            model: ProjectSelection,
                            include: [
                                {
                                    model: projects,
                                    attributes: ['name', 'isDraft', 'is_completed'],
                                    where: {
                                        is_completed: 0,
                                    },
                                    required: false,
                                },
                                {
                                    attributes: ['selection_id'],
                                    model: SelectionItems,
                                    include: [
                                        {
                                            attributes: ['itemID', 'id', 'is_available'],
                                            model: Items,
                                        },
                                    ],
                                },
                                {
                                    attributes: ['selection_id'],
                                    model: SelectionContainers,
                                    include: [
                                        {
                                            attributes: ['containerID', 'id', 'is_available'],
                                            model: Containers,
                                        },
                                    ],
                                },
                                {
                                    attributes: ['selection_id'],
                                    model: SelectionTrucks,
                                    include: [
                                        {
                                            attributes: ['truckID', 'id', 'is_available'],
                                            model: Trucks,
                                        },
                                    ],
                                },
                                {
                                    attributes: ['selection_id'],
                                    model: SelectionGroups,
                                    include: [
                                        {
                                            attributes: ['groupID', 'id', 'is_available'],
                                            model: Groups,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
        }
        const devices = limit ? await Device.findAndCountAll(filter) : await Device.findAll(filter)
        res.json(devices)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use(userAuth)

// Fetch device interval
router.post('/fetch-interval', async (req, res) => {
    try {
        const { device_id, project_id } = req.body
        const projectSelections = await ProjectSelection.findAll({
            include: [
                {
                    model: SelectionDevice,
                    include: [
                        {
                            model: Device,
                        },
                    ],
                    where: {
                        device_id,
                    },
                },
            ],
            where: {
                project_id,
            },
        })
        res.json(projectSelections)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch project event device
router.post('/fetch-project-event-device', async (req, res) => {
    try {
        const { project_id, item_id, container_id } = req.body
        let include = []
        if (container_id) {
            include = [{ model: SelectionDevice }, { model: SelectionContainers, where: { container_id } }]
        }
        if (item_id) {
            include = [{ model: SelectionDevice }, { model: SelectionItems, where: { item_id } }]
        }

        if (!!project_id && (!!item_id || !!container_id)) {
            const projectSelections = await ProjectSelection.findAll({
                include,
                where: { project_id },
            })
            const projectDevices = []
            projectSelections.map((pSelection) => {
                if (pSelection.selection_devices.length > 0) {
                    pSelection.selection_devices.map(({ device_id }) => projectDevices.push(device_id))
                }
            })
            const devices = await Device.findAll({
                where: { id: _.uniq(projectDevices) },
            })
            return res.json(devices)
        }
        res.json([])
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch project device
router.post('/fetch-project-device', async (req, res) => {
    try {
        const { project_id } = req.body
        const projectSelections = await ProjectSelection.findAll({
            include: [{ model: SelectionDevice }],
            where: { project_id },
        })
        const projectDevices = []
        projectSelections.map((pSelection) => {
            if (pSelection.selection_devices.length > 0) {
                pSelection.selection_devices.map((device) => {
                    projectDevices.push(device.device_id)
                })
            }
        })
        res.json(projectDevices)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Device code
router.post('/add', async (req, res) => {
    try {
        const device_exist = await Device.findOne({
            where: { deviceID: sequelize.where(sequelize.fn('LOWER', sequelize.col('deviceID')), req.body.deviceID.toLowerCase()), vendor_id: req.body.vendor_id },
        })
        if (device_exist) {
            return res.json({ deviceAlreadyExists: true })
        }
        const deviceID = req.body.deviceID
        const device = await Device.create({
            deviceID,
            organization_id: req.user.organization_id,
            vendor_id: req.body.vendor_id,
            tag: req.body.tag,
        })
        res.json(device)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Device code
router.post('/update', async (req, res) => {
    try {
        const device_exist = await Device.findOne({
            where: {
                deviceID: sequelize.where(sequelize.fn('LOWER', sequelize.col('deviceID')), req.body.deviceID.toLowerCase()),
                vendor_id: req.body.vendor_id,
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (device_exist) {
            return res.json({ deviceAlreadyExists: true })
        }

        const record = await Device.update(req.body, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Device code
router.post('/remove', async (req, res) => {
    try {
        const record = await Device.destroy({
            where: { id: req.body.id },
        })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})
// Make device on and off based on the  0(data on) and 1(off)
// iot data on
router.post('/iot-on', async (req, res) => {
    const { id } = req.body
    try {
        await SelectionDevice.update(
            {
                is_stopped: 0,
            },
            {
                where: {
                    device_id: id,
                },
            },
        )
        res.json({ message: 'updated scessfully' })
    } catch (err) {
        console.log(err)
    }
})
// iot  data off
router.post('/iot-off', async (req, res) => {
    const { id } = req.body
    try {
        await SelectionDevice.update(
            {
                is_stopped: 1,
            },
            {
                where: {
                    device_id: id,
                },
            },
        )
        res.json({ message: 'updated scessfully' })
    } catch (err) {
        console.log(err)
    }
})

module.exports = router
