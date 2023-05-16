// Load dependencies
const express = require('express')
const _ = require('lodash')
const string = require('../helpers/LanguageHelper')
const cronHelper = require('../helpers/cron-helper')
const ShortUniqueId = require('short-unique-id')

// Define global variables
const router = express.Router()

// Load MySQL Models
const db = require('../models')

const Item = db.items
const Device = db.devices
const Project = db.projects
const ProjectSelection = db.project_selections
const SelectionGroup = db.selection_groups
const SelectionTruck = db.selection_trucks
const SelectionContainer = db.selection_containers
const SelectionItem = db.selection_items
const SelectionDevice = db.selection_devices
const Container = db.containers
const Group = db.groups
const Truck = db.trucks
const { Op } = db.Sequelize
const { sequelize } = db
const { PlanInclusion } = require('../services/subscription/subscription_service')

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch Items code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const items = limit
            ? await Item.findAndCountAll({
                  where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await Item.findAll()
        res.json(items)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch Items code
router.post('/fetch-item', async (req, res) => {
    try {
        const { id } = req.body
        const item = await Item.findOne({ where: { id } })
        res.json(item)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Item code
router.post('/add', async (req, res) => {
    try {
        const randomCode = new ShortUniqueId({ length: 30 })
        const payload = {
            itemID: req.body.itemID,
            qr_code: randomCode(),
            manual_code: req.body.manualCode,
            organization_id: req.user.organization_id,
        }
        const checkItemExists = await Item.findAll({
            where: {
                itemID: sequelize.where(sequelize.fn('LOWER', sequelize.col('itemID')), req.body.itemID.toLowerCase()),
            },
        })
        if (checkItemExists.length > 0) {
            return res.json({ itemAlreadyExists: true })
        }
        if (req.body.is_available === 0) {
            payload.is_available = req.body.is_available
        }
        return Item.create(payload).then(function (item) {
            if (item) {
                res.json(item)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Item code
router.post('/update', async (req, res) => {
    try {
        if (req.body.itemID) {
            const checkItemExists = await Item.findAll({
                where: {
                    itemID: sequelize.where(sequelize.fn('LOWER', sequelize.col('itemID')), req.body.itemID.toLowerCase()),
                    id: { [Op.notIn]: [req.body.id] },
                },
            })
            if (checkItemExists.length > 0) {
                return res.json({ itemAlreadyExists: true })
            }
        }
        const record = Item.update(req.body, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Item code
router.post('/remove', async (req, res) => {
    try {
        const record = await Item.destroy({
            where: { id: req.body.id },
        })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Project Item code
router.post('/add-project-item', async (req, res) => {
    try {
        const { project_id, item_id, container_id, truck_id, group_id, devices } = req.body

        let project_selection = null
        if (project_id) {
            project_selection = await ProjectSelection.create({ project_id })
        }

        if (project_selection) {
            if (group_id) {
                await SelectionGroup.create({ selection_id: project_selection.id, group_id })
            }

            if (truck_id) {
                await SelectionTruck.create({ selection_id: project_selection.id, truck_id })
            }

            if (container_id) {
                await SelectionContainer.create({ selection_id: project_selection.id, container_id })
            }

            if (item_id) {
                await SelectionItem.create({ selection_id: project_selection.id, item_id })
            }

            if (Array.isArray(devices) && devices.length && devices.some((device) => device.value)) {
                const deviceData = []
                const devicePromise = devices.map(async ({ value: device_id = null, tag = '' }) => {
                    if (device_id) {
                        await Device.update({ tag, is_available: 0 }, { where: { id: device_id } })
                        deviceData.push({
                            selection_id: project_selection.id,
                            device_id,
                            data_interval: 4,
                        })
                    }
                })
                await Promise.all(devicePromise)
                await SelectionDevice.bulkCreate(deviceData)
            }
        }

        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update item device
router.post('/update-item-device', async (req, res) => {
    try {
        const { project_id, item_id, devices } = req.body

        let pSelection = null
        const projectSections = await ProjectSelection.findAll({
            include: [{ model: SelectionItem }, { model: SelectionDevice }],
            where: { project_id },
        })

        pSelection = projectSections.find((selection) => selection.selection_items[0].item_id == item_id)
        
        // Device
        const selectionDevices = pSelection.selection_devices

        // fetching device list from other selections and not making them available on devices table
        const otherItemDevices = [].concat.apply(
            [],
            projectSections.filter((ps) => ps.selection_items[0].item_id != item_id).map((ps) => ps.selection_devices.map((sdevice) => sdevice.device_id)),
        )

        if (selectionDevices.length) {
            const deviceIds = selectionDevices.filter((device) => !otherItemDevices.includes(device.device_id)).map((device) => device.device_id)
            if (deviceIds.length) {
                await Device.update({ is_available: 1 }, { where: { id: { [Op.in]: deviceIds } } })
            }
        }

        await SelectionDevice.destroy({
            where: {
                selection_id: pSelection.id,
            },
        })
        if (Array.isArray(devices) && devices.length && devices.some((device) => device.value)) {
            const deviceData = []
            const devicePromise = devices.map(async ({ value: device_id = null, tag = '' }) => {
                if (device_id) {
                    await Device.update({ tag, is_available: 0 }, { where: { id: device_id } })
                    deviceData.push({
                        selection_id: pSelection.id,
                        device_id,
                        data_interval: 4,
                        is_started: pSelection.selection_items[0].is_start || 0,
                    })
                }
            })
            await Promise.all(devicePromise)
            await SelectionDevice.bulkCreate(deviceData)
        }

        await cronHelper.cronRestartApi()

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch item device
router.post('/fetch-item-device', async (req, res) => {
    try {
        const { project_id, item_id } = req.body

        let pSelection = []
        let deviceDetails = null
        const projectSelections = await ProjectSelection.findAll({
            include: [{ model: SelectionItem }],
            where: { project_id },
        })

        pSelection = projectSelections.filter((selection) => selection.selection_items.length > 0 && selection.selection_items[0].item_id == item_id)
        if (pSelection.length > 0) {
            deviceDetails = await SelectionDevice.findAll({ include: [{ model: Device }], where: { selection_id: pSelection[0].id } })
        }

        res.json({ deviceDetails })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch item project
router.post('/fetch-item-project', async (req, res) => {
    try {
        const { item_id, container_id } = req.body

        let project_id
        let projectObj = {}
        const selectionItem = await SelectionItem.findAll({
            where: { item_id },
        })
        const selectionContainer = await SelectionContainer.findAll({
            where: { container_id },
        })
        if (selectionItem.length > 0 && selectionContainer.length > 0) {
            const selectionObj = selectionItem.find((itemSelection) => selectionContainer.some((containerSelection) => itemSelection.selection_id == containerSelection.selection_id))
            const selectionProject = await ProjectSelection.findOne({
                include: [
                    {
                        model: Project,
                        required: true,
                        where: {
                            isDraft: 0,
                        },
                    },
                ],
                where: { id: selectionObj.selection_id },
            })
            if (selectionProject) {
                project_id = selectionProject.project_id
            }
            projectObj = await Project.findByPk(project_id)
        }

        res.json({ projectObj })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Track item
router.get('/track-item', async (req, res) => {
    try {
        const { code, qrCode } = req.query
        const itemWhere = {}
        const containerWhere = {}
        if (qrCode) {
            containerWhere.unique_code = qrCode
            itemWhere.qr_code = qrCode
        }
        if (code) {
            containerWhere.manual_code = code
            itemWhere.manual_code = code
        }
        const item = await Item.findOne({ logging: console.log, where: itemWhere, attributes: ['id', 'itemID'] })
        const container = await Container.findOne({ logging: console.log, where: containerWhere, attributes: ['id', 'containerID'] })
        if (!item && !container) {
            return res.json({
                item_id: 0,
                project_id: 0,
                item_selection: { item: { id: 0, itemID: '' } },
            })
        }
        const { id = 0 } = item || {}
        const { id: container_id = 0 } = container || {}
        let selection_id = 0
        const item_selection = { item: '' }

        if (id) {
            const itemSelection = await SelectionItem.findAll({
                include: [
                    {
                        model: ProjectSelection,
                        required: true,
                        include: [
                            {
                                model: Project,
                                required: true,
                                attributes: ['isDraft', 'id'],
                                where: {
                                    isDraft: 0,
                                },
                            },
                        ],
                    },
                ],
                where: { item_id: id },
            })
            if (itemSelection.length && itemSelection[0].selection_id) {
                selection_id = [itemSelection[0].selection_id]
            }
            item_selection.item = { id: item.id, itemID: item.itemID }
        }
        if (container_id) {
            const containerSelection = await SelectionContainer.findAll({
                include: [
                    {
                        model: ProjectSelection,
                        required: true,
                        include: [
                            {
                                model: Project,
                                required: true,
                                attributes: ['isDraft', 'id'],
                                where: {
                                    isDraft: 0,
                                },
                            },
                        ],
                    },
                ],
                where: { container_id },
            })
            if (containerSelection.length && containerSelection[0].selection_id) {
                selection_id = containerSelection.map((container) => container.selection_id)
            }
        }
        let projectId = 0
        if (selection_id) {
            let include = []
            if (item) {
                include = [
                    { model: SelectionContainer, attributes: ['id'], include: [{ model: Container, attributes: ['id', 'containerID'] }] },
                    { model: SelectionGroup, attributes: ['id'], include: [{ model: Group, attributes: ['id', 'groupID'] }] },
                    { model: SelectionTruck, attributes: ['id'], include: [{ model: Truck, attributes: ['id', 'truckID'] }] },
                ]
            }
            if (container) {
                include = [
                    { model: SelectionItem, attributes: ['id'], include: [{ model: Item, attributes: ['id', 'itemID'] }] },
                    { model: SelectionContainer, attributes: ['id'], include: [{ model: Container, attributes: ['id', 'containerID'] }] },
                    { model: SelectionGroup, attributes: ['id'], include: [{ model: Group, attributes: ['id', 'groupID'] }] },
                    { model: SelectionTruck, attributes: ['id'], include: [{ model: Truck, attributes: ['id', 'truckID'] }] },
                ]
            }
            const projectSelections = await ProjectSelection.findAll({
                where: { id: { [Op.in]: selection_id } },
                attributes: ['project_id'],
                include,
                // logging: console.log,
            })
            if (projectSelections.length) {
                const projectSelection = projectSelections.find((selection) => selection.project_id == projectSelections[0].project_id)
                if (projectSelection) {
                    const { project_id, selection_items = [], selection_containers = [], selection_groups = [], selection_trucks = [] } = projectSelection
                    if (container && selection_items[0] && selection_items[0].item && selection_items[0].item.itemID) {
                        const projectSelectionItems = projectSelections.filter((selection) => selection.project_id == projectSelections[0].project_id)
                        const items = []
                        projectSelectionItems.map((selection) => {
                            selection.selection_items.map((selected_item) => {
                                items.push({ id: selected_item.item.id, itemID: selected_item.item.itemID })
                            })
                            item_selection.item = items
                        })
                    }
                    if (selection_containers[0] && selection_containers[0].container && selection_containers[0].container.containerID) {
                        item_selection.container = { id: selection_containers[0].container.id, containerID: selection_containers[0].container.containerID }
                    }
                    if (selection_groups[0] && selection_groups[0].group && selection_groups[0].group.groupID) {
                        item_selection.group = { id: selection_groups[0].group.id, groupID: selection_groups[0].group.groupID }
                    }
                    if (selection_trucks[0] && selection_trucks[0].truck && selection_trucks[0].truck.truckID) {
                        item_selection.truck = { id: selection_trucks[0].truck.id, truckID: selection_trucks[0].truck.truckID }
                    }
                    if (project_id) {
                        projectId = project_id
                    }
                }
            }
        }
        return res.json({ item_id: id, container_id, project_id: projectId, item_selection, isContainer: !!container })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch item's project
router.post('/fetch-items-project', async (req, res) => {
    try {
        const { item_id } = req.body
        const projectDetails = await SelectionItem.findOne({
            where: { item_id },
            include: [
                {
                    model: ProjectSelection,
                    include: [
                        {
                            model: Project,
                        },
                    ],
                },
            ],
        })
        res.json(projectDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/check-qr-code', async (req, res) => {
    try {
        const { qr_code } = req.body
        const existingQrCode = await Item.count({ where: { qr_code } })

        if (existingQrCode) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/code', async (req, res) => {
    try {
        const itemID = req.query.itemID
        const itemDetails = await Item.findOne({ where: { itemID: itemID } })
        res.json(itemDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
