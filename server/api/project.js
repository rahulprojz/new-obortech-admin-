// Load dependencies
const express = require('express')
const multipart = require('connect-multiparty')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')
const Model = require('sequelize/lib/model')
const string = require('../helpers/LanguageHelper')
const cronHelper = require('../helpers/cron-helper')

const networkHelper = require('../helpers/network-helper.js')
const networkHooks = require('../hooks/network-hooks')
const projectEventHelper = require('../helpers/project-event-helper.js')
const { hostAuth, userAuth, jwtAuth } = require('../middlewares')
const mongooseDB = require('../models/mangoose/index.model')
const Sequelize = require('sequelize')
const mdb = require('../models/mangoose/index.model')
const { getProjectByName, getGrouptByName, getItemByName, getDeviceByName, getTruckByName, getContainerByName, selectionValidation } = require('../utils/projectEventHelpers/project-event-helper')
// Load MySQL Models
const db = require('../models')

const Device = db.devices
const Project = db.projects
const ProjectFolder = db.project_folders
const PdcRequests = db.pdc_request
const PdcOrganization = db.pdc_organizations
const ProjectParticipant = db.project_participants
const ProjectParticipantCategories = db.project_participant_categories
const ProjectpdcCategoryEvents = db.project_pdc_category_events
const ParticipantCategories = db.participant_categories
const OrganizationCategories = db.organization_categories
const ProjectEventCategory = db.project_event_categories
const EventCategory = db.event_categories
const ProjectDocumentCategories = db.project_document_categories
const DocumentCategories = db.document_categories
const Events = db.events
const ProjectUser = db.project_users
const ProjectSelection = db.project_selections
const ProjectRoad = db.project_roads
// const ProjectEvent = db.project_events
const SealingDetail = db.sealing_details
const TamperDetail = db.tamper_details
const SelectionDevice = db.selection_devices
const SelectionItem = db.selection_items
const SelectionContainer = db.selection_containers
const SelectionTruck = db.selection_trucks
const SelectionGroup = db.selection_groups
const ProjectAlert = db.project_alerts
const Item = db.items
const Container = db.containers
const Group = db.groups
const Users = db.users
const Truck = db.trucks
const Station = db.stations
const ProjectCategory = db.project_categories
const ProjectDocumentCategory = db.project_document_categories
const Organization = db.organizations
const Notification = db.notifications
const DeviceApiLog = db.device_api_logs
const ProjectSidebarFolders = db.project_sidebar_folders
const ProjectPdcCategory = db.project_pdc_categories
const { Op } = db.Sequelize

router.use(hostAuth)
const CRON_URL = 'https://cron.obortech.io/api/v1/cron'
// Fetch All Projects only
router.get('/', [userAuth], async (req, res) => {
    try {
        const options = {
            include: [
                {
                    model: ProjectCategory,
                    attributes: ['name'],
                },
            ],
            where: {
                archived: false,
                user_id: req.user.id,
            },
            order: [['id', 'DESC']],
        }
        if (req.query.sort && req.query.sortBy) {
            options.order = [Sequelize.fn('isnull', Sequelize.col(req.query.sortBy.toString())), [req.query.sortBy.toString(), req.query.sort.toString()]]
        }

        const projects = await Project.findAll(options)
        res.json(projects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All Projects in which user is a prticipant
router.get('/fetch-all', [jwtAuth, userAuth], async (req, res) => {
    try {
        const options = {
            attributes: ['project_id'],
            where: {
                user_id: req.user.id,
            },
            group: ['project_id'],
            include: [
                {
                    model: Project,
                    attributes: ['id', 'name', 'uniqueId', 'is_completed', 'createdAt', 'updatedAt'],
                    include: [
                        {
                            model: ProjectCategory,
                            attributes: ['name'],
                        },
                    ],
                    where: {
                        archived: false,
                        isDraft: 0,
                    },
                    order: [['id', 'DESC']],
                },
            ],
        }
        const projects = await ProjectUser.findAll(options)
        const allProjects = projects.map((data) => data.project)
        res.json(allProjects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch project submission details, events, documents and PDCs
router.get('/fetch-submission-details/:id', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { id } = req.params
        const projectData = await Project.findOne({
            where: { id },
            attributes: [],
            include: [
                {
                    model: ProjectCategory,
                    include: [
                        {
                            model: ProjectPdcCategory,
                            attributes: ['name', 'pdc_name'],
                            where: {
                                is_active: 1,
                            },
                            required: false,
                            include: [
                                {
                                    model: ProjectpdcCategoryEvents,
                                    attributes: ['event_id'],
                                    include: [{ model: Events, attributes: ['id', 'uniqId', 'eventName', 'mongolianName'] }],
                                },
                                {
                                    model: PdcOrganization,
                                    attributes: [],
                                    where: { submit_user_id: req.user.id },
                                },
                            ],
                        },
                        {
                            model: ProjectEventCategory,
                            include: [{ model: EventCategory, include: [{ model: Events, attributes: ['id', 'uniqId', 'eventName', 'mongolianName'] }] }],
                        },
                        {
                            model: ProjectDocumentCategories,
                            include: [{ model: DocumentCategories, include: [{ model: Events, attributes: ['id', 'uniqId', 'eventName', 'mongolianName'] }] }],
                        },
                    ],
                },
            ],
        })

        const documentArray = []
        const eventArray = []
        const pdcArray = []
        if (projectData && projectData.project_category) {
            if (projectData.project_category.project_pdc_categories.length > 0) {
                projectData.project_category.project_pdc_categories.map((pdcCategory) => pdcArray.push(pdcCategory))
            }
            if (projectData.project_category.project_event_categories.length > 0) {
                projectData.project_category.project_event_categories.map((eventCat) => eventArray.push(eventCat.event_category.events))
            }
            if (projectData.project_category.project_document_categories.length > 0) {
                projectData.project_category.project_document_categories.map((documentCat) => documentArray.push(documentCat.document_category.events))
            }
        }

        res.json({ pdcArray, eventList: [].concat.apply([], eventArray || []), documentList: [].concat.apply([], documentArray || []) })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Project selection data
router.post('/update-selection', [jwtAuth, userAuth], async (req, res) => {
    try {
        let selection = {}
        req.body['projectselectiontype'] = ''
        req.body['isTemporary'] = true
        req.body['user_id'] = req.user.id
        req.body['isDeviceUsedByOthers'] = [false]
        const project_name = req.body.project_name
        const projectData = await getProjectByName(project_name)
        if (projectData && projectData.is_completed) {
            return res.json({ error: 'This project was completed' })
        }

        if (!projectData) {
            return res.json({ error: 'This project was not available' })
        }

        const project_id = projectData.id
        const isDraft = projectData.draft
        const item_name = req.body.item_name
        const itemData = await getItemByName(item_name)
        selection.item_id = itemData.id

        //Check if item is available
        const checkItem = await Item.count({
            where: {
                id: selection.item_id,
                is_available: 1,
            },
        })
        if (checkItem == 0) {
            return res.json({ error: 'Item not available' })
        }

        const container_name = req.body.container_name
        const containerData = await getContainerByName(container_name)
        selection.container_id = containerData.id

        const group_name = req.body.group_name
        const groupData = await getGrouptByName(group_name)
        selection.group_id = groupData.id

        const truck_name = req.body.truck_name
        const truckData = await getTruckByName(truck_name)
        selection.truck_id = truckData.id

        //  Checking the selection was already used in any other projects or not
        const isValidSelection = await selectionValidation(projectData.id, selection)
        if (!isValidSelection.success) {
            const { validationMessage } = isValidSelection
            const message = Object.keys(validationMessage)
                .map(function (key, index) {
                    if (validationMessage[key]) return validationMessage[key]
                })
                .filter((e) => e)
                .join(', ')
            return res.json({ error: `${message} already in used different selection` })
        }
        selection.devices = []
        const selectionDevices = req.body.devices
        let isDeviceAlreadyUsed = false
        const selectedDevices = selectionDevices.map(async (device, i) => {
            const deviceData = await getDeviceByName(device.device_name)
            const deviceObj = {
                device_id: deviceData.id,
                tag: device.tag,
            }
            const checkDeviceData = await Device.count({
                where: {
                    id: deviceData.id,
                    is_available: 1,
                },
            })
            if (checkDeviceData == 0) {
                //check if it used in the same project
                const selectionDevicesData = await SelectionDevice.findAll({
                    where: {
                        device_id: deviceData.id,
                    },
                    include: [
                        {
                            model: ProjectSelection,
                        },
                    ],
                })
                selectionDevicesData.forEach((selectionDevice) => {
                    if (project_id != selectionDevice.project_selection.project_id) {
                        isDeviceAlreadyUsed = true
                    }
                })
            }

            selection.devices.push(deviceObj)
        })
        await Promise.all(selectedDevices)
        if (isDeviceAlreadyUsed) {
            return res.json({ error: 'Device is used in another project' })
        }

        selection.projectselectiontype = req.body.projectselectiontype
        selection.selectionTemperatureArray = req.body.selectionTemperatureArray
        selection.isTemporary = req.body.isTemporary
        selection.item_is_start = req.body.item_is_start
        selection.item_start_date_time = req.body.item_start_date_time
        selection.isDeviceUsedByOthers = req.body.isDeviceUsedByOthers

        const project_selection = await ProjectSelection.create({
            project_id,
        })
        const alertArray = _.map(selection.selectionTemperatureArray, (selectiontemprature, i) => {
            let alertselectionId = 3
            if (selectiontemprature.selectionId == '1' && selection.group_id != '1') {
                alertselectionId = selectiontemprature.selectionId
            }
            if (selectiontemprature.selectionId == '2' && selection.truck_id != '1') {
                alertselectionId = selectiontemprature.selectionId
            }
            if (selectiontemprature.selectionId == '5' && selection.devices.length && selection.devices[0].device_id) {
                alertselectionId = selectiontemprature.selectionId
            }

            return {
                project_id,
                selection_id: project_selection.id,
                selection_element: alertselectionId,
                device_id: selectiontemprature.device_id || 0,
                changed_selection: selectiontemprature.changed_selection,
                temperature_alert_min: selectiontemprature.temperature_alert_min,
                temperature_alert_max: selectiontemprature.temperature_alert_max,
                temperature_alert_interval: selectiontemprature.temperature_alert_interval,
                temperature_allowed_occurances: selectiontemprature.temperature_allowed_occurances,
                humidity_alert_min: selectiontemprature.humidity_alert_min,
                humidity_alert_max: selectiontemprature.humidity_alert_max,
                humidity_alert_interval: selectiontemprature.humidity_alert_interval,
                humidity_allowed_occurances: selectiontemprature.humidity_allowed_occurances,
                ambience_threshold: selectiontemprature.ambience_threshold,
            }
        })
        await ProjectAlert.bulkCreate(alertArray)
        const isDeviceAvailable = Array.isArray(selection.devices) && selection.devices.length && selection.devices.some((d) => d.device_id)

        await SelectionItem.create({
            selection_id: project_selection.id,
            item_id: selection.item_id,
            is_start: isDeviceAvailable ? selection.item_is_start : null,
            start_date_time: isDeviceAvailable ? selection.item_start_date_time : null,
        })

        await Item.update({ is_available: 0 }, { where: { id: selection.item_id } })

        await SelectionContainer.create({
            selection_id: project_selection.id,
            container_id: selection.container_id,
        })

        await Container.update({ is_available: 0 }, { where: { id: selection.container_id } })

        await SelectionTruck.create({
            selection_id: project_selection.id,
            truck_id: selection.truck_id,
        })

        await Truck.update({ is_available: 0 }, { where: { id: selection.truck_id } })

        if (isDeviceAvailable) {
            const deviceData = []
            const devices = selection.devices.map(async ({ device_id = null, tag = '', is_started, is_stoped }) => {
                if (device_id) {
                    await Device.update({ tag, is_available: isDraft ? 1 : 0 }, { where: { id: device_id } })
                    deviceData.push({
                        selection_id: project_selection.id,
                        device_id,
                        is_started: !!selection.item_is_start,
                        data_interval: 4,
                    })
                }
            })
            await Promise.all(devices)
            await SelectionDevice.bulkCreate(deviceData)
        }

        await SelectionGroup.create({
            selection_id: project_selection.id,
            group_id: selection.group_id,
        })

        await Group.update({ is_available: 0 }, { where: { id: selection.group_id } })
        if (!isDeviceAvailable) {
            cronHelper.cronRestartApi().then(() => {})
        }
        res.json(selection)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/fetch-project-selections', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { role_id, id: user_id } = req.user
        const isNotAdminRole = role_id != process.env.ROLE_ADMIN
        const isNotPublicUserRole = role_id != process.env.ROLE_PUBLIC_USER
        const isManagerRole = role_id == process.env.ROLE_MANAGER
        const itemWhere = {}
        let project_id
        if (req.body.project_id) {
            project_id = req.body.project_id
        }
        if (req.body.project_name) {
            const projectData = await getProjectByName(req.body.project_name)
            project_id = projectData.id
        }
        const projectDetails = await Project.findByPk(project_id)
        if (isManagerRole && projectDetails ? projectDetails.user_id != user_id : isNotAdminRole && isNotPublicUserRole) {
            const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, project_id)
            if (userManualEvents.length) {
                const itemId = userManualEvents.map((event) => parseInt(event.item_id))
                itemWhere.item_id = { [Op.in]: itemId }
            }
        }

        const project = await Project.findOne({
            attributes: ['id', 'name'],
            include: [
                {
                    model: ProjectSelection,
                    separate: true,
                    include: [
                        {
                            model: ProjectAlert,
                        },
                        {
                            model: SelectionItem,
                            include: [
                                {
                                    model: Item,
                                },
                            ],
                            where: itemWhere,
                        },
                        {
                            model: SelectionContainer,
                            include: [
                                {
                                    model: Container,
                                },
                            ],
                        },
                        {
                            model: SelectionGroup,
                            include: [
                                {
                                    model: Group,
                                },
                            ],
                        },
                        {
                            model: SelectionDevice,
                            include: [
                                {
                                    model: Device,
                                },
                            ],
                        },
                        {
                            model: SelectionTruck,
                            include: [
                                {
                                    model: Truck,
                                },
                            ],
                        },
                    ],
                },
                { model: ProjectRoad },
                { model: ProjectCategory, attributes: ['name'] },
                {
                    model: ProjectParticipant,
                    separate: true,
                    include: [
                        {
                            model: Organization,
                            attributes: ['id', 'unique_id', 'name'],
                            required: true,
                            where: { isDeleted: 0 },
                            include: [
                                {
                                    model: Users,
                                    attributes: ['id', 'unique_id', 'username'],
                                    where: {
                                        status: 1,
                                        isDeleted: 0,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
            where: {
                id: project_id,
            },
            order: [[db.project_roads, 'order', 'ASC']],
        })

        res.json(project)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use(userAuth)
// fetch archived projects
router.get('/fetch-archived', async (req, res) => {
    try {
        const projects = await Project.findAndCountAll({
            attributes: ['name', 'createdAt', 'id'],
            include: [
                {
                    model: ProjectCategory,
                    attributes: ['name'],
                },
            ],
            where: {
                user_id: req.user.id,
                archived: true,
            },
            order: [['id', 'DESC']],
        })
        res.json(projects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/non-draft', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            include: [
                {
                    model: ProjectCategory,
                    attributes: ['name'],
                },
                {
                    model: ProjectSelection,
                },
            ],
            where: { isDraft: { [Op.ne]: 1 }, user_id: req.user.id, archived: false },
            order: [['createdAt', 'DESC']],
        }

        if (req.query.sort && req.query.sortBy) {
            filter.order = [[req.query.sortBy.toString(), req.query.sort.toString()]]
        }

        if (limit) {
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.distinct = true
        }
        const projects = limit ? await Project.findAndCountAll(filter) : await Project.findAll(filter)
        res.json(projects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/draft', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            include: [
                {
                    model: ProjectCategory,
                    attributes: ['name'],
                },
            ],
            where: { isDraft: { [Op.eq]: 1 }, user_id: req.user.id },
            order: [['createdAt', 'DESC']],
        }
        if (limit) {
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
        }
        const projects = limit ? await Project.findAndCountAll(filter) : await Project.findAll(filter)
        res.json(projects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/fetch-project-roads', async (req, res) => {
    try {
        const { project_id } = req.body
        const projectRoad = await ProjectRoad.findAll({
            where: {
                project_id,
            },
        })
        res.json(projectRoad)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/fetch-all-project-selections', async (req, res) => {
    try {
        const projects = await ProjectUser.findAll({
            include: [
                {
                    model: Project,
                    include: [
                        {
                            model: ProjectSelection,
                            separate: true,
                            include: [
                                {
                                    model: SelectionItem,
                                    include: [
                                        {
                                            model: Item,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionContainer,
                                    include: [
                                        {
                                            model: Container,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionGroup,
                                    include: [
                                        {
                                            model: Group,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionDevice,
                                    include: [
                                        {
                                            model: Device,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionTruck,
                                    include: [
                                        {
                                            model: Truck,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            where: {
                user_id: req.user.id,
            },
            order: [[db.projects, 'id', 'DESC']],
        })

        const projectsAry = []
        if (projects) {
            projects.map((project, i) => {
                projectsAry.push(project.project)
            })
        }
        res.json(projectsAry)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All Project code
// router.get('/fetch', async (req, res) => {
//     try {
//         const projects = await ProjectUser.findAll({
//             include: [
//                 {
//                     model: Project,
//                     where: {
//                         archived: false,
//                         is_completed: false,
//                     },
//                     include: [
//                         {
//                             model: ProjectSelection,
//                             separate: true,
//                             include: [
//                                 {
//                                     model: ProjectAlert,
//                                 },
//                                 {
//                                     model: SelectionItem,
//                                     include: [
//                                         {
//                                             model: Item,
//                                         },
//                                     ],
//                                 },
//                                 {
//                                     model: SelectionContainer,
//                                     include: [
//                                         {
//                                             model: Container,
//                                         },
//                                     ],
//                                 },
//                                 {
//                                     model: SelectionGroup,
//                                     include: [
//                                         {
//                                             model: Group,
//                                         },
//                                     ],
//                                 },
//                                 {
//                                     model: SelectionDevice,
//                                     include: [
//                                         {
//                                             model: Device,
//                                         },
//                                     ],
//                                 },
//                                 {
//                                     model: SelectionTruck,
//                                     include: [
//                                         {
//                                             model: Truck,
//                                         },
//                                     ],
//                                 },
//                             ],
//                         },
//                         { model: ProjectRoad },
//                         { model: ProjectCategory, attributes: ['name'] },
//                         {
//                             model: ProjectParticipant,
//                             separate: true,
//                             include: [
//                                 {
//                                     model: Organization,
//                                     required: true,
//                                     include: [
//                                         {
//                                             model: Users,
//                                             where: {
//                                                 status: 1,
//                                             },
//                                         },
//                                     ],
//                                 },
//                             ],
//                         },
//                         {
//                             model: ProjectUser,
//                             separate: true,
//                             include: [
//                                 {
//                                     model: Users,
//                                 },
//                             ],
//                         },
//                     ],
//                 },
//             ],
//             where: {
//                 user_id: req.user.id,
//             },
//             order: [
//                 [db.projects, 'id', 'DESC'],
//                 [db.projects, db.project_roads, 'order', 'ASC'],
//                 // [db.projects, db.project_selections, 'id', 'ASC'],
//             ],
//         })

//         const projectsAry = []
//         if (projects) {
//             return res.json(
//                 projects.map((project, i) => {
//                     return project.project
//                 }),
//             )
//         }
//         res.json(projectsAry)
//     } catch (err) {
//         res.json({ error: err.message || err.toString() })
//     }
// })
router.get('/fetch', async (req, res) => {
    try {
        const projects = await ProjectUser.findAll({
            include: [
                {
                    model: Project,
                    attributes: ['id'],
                    where: {
                        archived: false,
                        is_completed: false,
                    },
                    attributes: ['id', 'isDraft', 'name'],
                    include: [
                        {
                            model: ProjectSelection,
                            separate: true,
                            include: [
                                {
                                    model: ProjectAlert,
                                },
                                {
                                    model: SelectionItem,
                                    include: [
                                        {
                                            model: Item,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionContainer,
                                    include: [
                                        {
                                            model: Container,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionGroup,
                                    include: [
                                        {
                                            model: Group,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionDevice,
                                    include: [
                                        {
                                            model: Device,
                                        },
                                    ],
                                },
                                {
                                    model: SelectionTruck,
                                    include: [
                                        {
                                            model: Truck,
                                        },
                                    ],
                                },
                            ],
                        },
                        { model: ProjectRoad },
                        { model: ProjectCategory, attributes: ['name'] },
                        {
                            model: ProjectParticipant,
                            separate: true,
                            attributes: ['id', 'project_id', 'participant_id'],
                            include: [
                                {
                                    model: Organization,
                                    required: true,
                                    attributes: ['id', 'name'],
                                    where: { isDeleted: 0 },
                                    include: [
                                        {
                                            attributes: ['id', 'username', 'isApproved', 'status'],
                                            model: Users,
                                            where: {
                                                status: 1,
                                                isDeleted: 0,
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        // {
                        //     model: ProjectUser,
                        //     separate: true,
                        //     include: [
                        //         {
                        //             model: Users,
                        //         },
                        //     ],
                        // },
                    ],
                },
            ],
            where: {
                user_id: req.user.id,
            },
            order: [
                [db.projects, 'id', 'DESC'],
                // [db.projects, db.project_roads, 'order', 'ASC'],
                // [db.projects, db.project_selections, 'id', 'ASC'],
            ],
        })

        const projectsAry = []
        if (projects) {
            return res.json(
                projects.map((project, i) => {
                    return project.project
                }),
            )
        }
        res.json(projectsAry)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch One Project via ID
router.post('/fetch-project-details', async (req, res) => {
    try {
        const { project_id } = req.body
        if (!project_id || Array.isArray(project_id)) {
            return res.json({ error: 'project_id is missing' })
        }

        const { group_id, container_id, truck_id, item_id } = req.body

        const project_event_where = { isDraft: { [Op.ne]: 1 } }

        if (project_id) project_event_where.id = parseInt(project_id)
        if (!project_id && group_id && group_id != 1) project_event_where['$project_selections.selection_groups.group_id$'] = group_id
        if (!project_id && truck_id && truck_id != 1) project_event_where['$project_selections.selection_trucks.truck_id$'] = truck_id
        if (!project_id && container_id) project_event_where['$project_selections.selection_containers.container_id$'] = container_id
        if (!project_id && item_id) project_event_where['$project_selections.selection_items.item_id$'] = item_id

        const includeArr = [
            {
                model: ProjectParticipant,
                separate: true,
                include: [
                    {
                        model: Organization,
                        include: [
                            {
                                model: Users,
                                where: {
                                    status: 1,
                                    isDeleted: 0,
                                },
                            },
                        ],
                        where: {
                            isApproved: 1,
                            sync_status: 2,
                            isDeleted: 0,
                        },
                    },
                ],
            },
            {
                model: ProjectUser,
                include: [
                    {
                        model: Users,
                        where: {
                            isDeleted: 0,
                        },
                    },
                ],
            },
        ]

        let projectObj = {}
        if (project_id) {
            projectObj = await Project.findOne({
                include: includeArr,
                where: { id: project_id },
            })
        } else {
            const projectIds = await Project.findAll({
                attributes: ['id'],
                include: [
                    {
                        model: ProjectSelection,
                        include: [
                            {
                                model: SelectionItem,
                            },
                            {
                                model: SelectionContainer,
                            },
                            {
                                model: SelectionTruck,
                            },
                            {
                                model: SelectionGroup,
                            },
                        ],
                    },
                ],
                where: project_event_where,
            })

            projectObj = await Project.findOne({
                include: includeArr,
                where: { id: projectIds[0].id },
            })
        }
        res.json(projectObj)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch One Project via ID
router.post('/fetch-project-data', async (req, res) => {
    const { project_id } = req.body
    try {
        const project = await Project.findOne({
            include: [
                {
                    model: ProjectSelection,
                    separate: true,
                    include: [
                        {
                            model: ProjectAlert,
                        },
                        {
                            model: SelectionItem,
                            separate: true,
                            include: [
                                {
                                    model: Item,
                                },
                            ],
                        },
                        {
                            model: SelectionContainer,
                            separate: true,
                            include: [
                                {
                                    model: Container,
                                },
                            ],
                        },
                        {
                            model: SelectionGroup,
                            separate: true,
                            include: [
                                {
                                    model: Group,
                                },
                            ],
                        },
                        {
                            model: SelectionDevice,
                            separate: true,
                            include: [
                                {
                                    model: Device,
                                },
                            ],
                        },
                        {
                            model: SelectionTruck,
                            separate: true,
                            include: [
                                {
                                    model: Truck,
                                },
                            ],
                        },
                    ],
                },
            ],
            where: { id: parseInt(project_id) },
        })
        res.json(project)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch One Project via ID
router.post('/fetchOne', async (req, res) => {
    const { project_id } = req.body
    try {
        const project = await Project.findOne({
            include: [
                {
                    model: ProjectSelection,
                    include: [
                        {
                            model: ProjectAlert,
                        },
                        {
                            model: SelectionItem,
                            include: [
                                {
                                    model: Item,
                                },
                            ],
                        },
                        {
                            model: SelectionContainer,
                            include: [
                                {
                                    model: Container,
                                },
                            ],
                        },
                        {
                            model: SelectionGroup,
                            include: [
                                {
                                    model: Group,
                                },
                            ],
                        },
                        {
                            model: SelectionDevice,
                            include: [
                                {
                                    model: Device,
                                },
                            ],
                        },
                        {
                            model: SelectionTruck,
                            include: [
                                {
                                    model: Truck,
                                },
                            ],
                        },
                    ],
                },
                {
                    model: ProjectCategory,
                    include: [
                        {
                            model: ProjectDocumentCategory,
                        },
                    ],
                },
                {
                    model: ProjectRoad,
                    include: [
                        {
                            model: Station,
                        },
                    ],
                },
                {
                    model: ProjectUser,
                    include: [
                        {
                            model: Users,
                            required: true,
                        },
                    ],
                },
                {
                    model: ProjectParticipant,
                    include: [
                        {
                            model: Organization,
                            include: [
                                {
                                    model: Users,
                                    where: {
                                        isDeleted: 0,
                                        status: 1,
                                    },
                                },
                            ],
                            where: {
                                isApproved: 1,
                                sync_status: 2,
                                isDeleted: 0,
                            },
                        },
                    ],
                },
            ],
            where: { id: project_id },
        })
        res.json(project)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch groups
router.post('/fetch-groups', async (req, res) => {
    try {
        const { project_id, sealingChecked, temperatureChecked, humidityChecked, tamperChecked } = req.body
        if (!project_id) {
            return res.json({ error: 'project_id is missing' })
        }

        const sSelections = await _getSelections('project', 0, project_id)
        const selectionGroups = await SelectionGroup.findAll({
            attributes: ['id', 'group_id', 'selection_id'],
            include: [{ model: Group }],
            where: {
                selection_id: { [Op.in]: sSelections },
            },
            order: [['id', 'ASC']],
        })

        const resultSelections = {
            groups: [],
            selections: sSelections,
        }
        const pSelections = selectionGroups.map(async (selection, i) => {
            const selections = await _getSelections('truck', selection.group_id, project_id, sSelections)
            const alertsCount = await _getAlerts(req.user.organization.blockchain_name, selections, project_id, selection.group_id, sealingChecked, temperatureChecked, humidityChecked, 'group', {}, tamperChecked)
            selection.dataValues.alert = alertsCount
            resultSelections.groups.push(selection)
        })
        await Promise.all(pSelections)

        res.json(resultSelections)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch trucks
router.post('/fetch-trucks', async (req, res) => {
    try {
        const { elm_type } = req.body
        const { elm_id } = req.body
        const { project_id } = req.body
        const { sealingChecked } = req.body
        const { temperatureChecked } = req.body
        const { humidityChecked } = req.body
        const { tamperChecked } = req.body
        const selectionsArr = req.body.selections
        let { selections } = req.body
        if (elm_id && elm_id != 'null') selections = await _getSelections(elm_type, elm_id, 0, selectionsArr)
        const selectionTrucks = await SelectionTruck.findAll({
            include: [{ model: Truck }],
            where: {
                selection_id: { [Op.in]: selections },
            },
            order: [['id', 'ASC']],
        })

        const resultSelections = []
        const pSelections = selectionTrucks.map(async (selection, i) => {
            const selections = await _getSelections('container', selection.truck_id, project_id, selectionsArr)
            const alertsCount = await _getAlerts(req.user.organization.blockchain_name, selections, project_id, selection.truck_id, sealingChecked, temperatureChecked, humidityChecked, 'truck', elm_id, tamperChecked)
            selection.dataValues.alert = alertsCount
            resultSelections.push(selection)
        })

        await Promise.all(pSelections)
        res.json(resultSelections)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch containers
router.post('/fetch-containers', async (req, res) => {
    try {
        const { elm_type } = req.body
        const { elm_id } = req.body
        const { project_id } = req.body
        const { sealingChecked } = req.body
        const { temperatureChecked } = req.body
        const { humidityChecked } = req.body
        const { tamperChecked } = req.body
        const selectionsArr = req.body.selections
        const project_selection_id = req.body.selection_id
        let { selections } = req.body
        if (elm_id && elm_id != 'null') selections = await _getSelections(elm_type, elm_id, 0, selectionsArr)
        const selectionContainers = await SelectionContainer.findAll({
            include: [{ model: Container }],
            where: {
                selection_id: { [Op.in]: selections },
            },
            order: [['id', 'ASC']],
        })

        const resultSelections = []
        const pSelections = selectionContainers.map(async (selection, i) => {
            const selections = await _getSelections('item', selection.container_id, project_id, selectionsArr)
            const alertsCount = await _getAlerts(req.user.organization.blockchain_name, selections, project_id, selection.container_id, sealingChecked, temperatureChecked, humidityChecked, 'container', elm_id, tamperChecked)
            selection.dataValues.alert = alertsCount
            resultSelections.push(selection)
        })

        await Promise.all(pSelections)
        res.json(resultSelections)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch items
router.post('/fetch-items', async (req, res) => {
    try {
        const { elm_type } = req.body
        const { elm_id } = req.body
        const { project_id } = req.body
        const { sealingChecked } = req.body
        const { temperatureChecked } = req.body
        const { humidityChecked } = req.body
        const { tamperChecked } = req.body

        const selectionsArr = req.body.selections
        let { selections } = req.body
        if (elm_id && elm_id != 'null') selections = await _getSelections(elm_type, elm_id, 0, selectionsArr)
        const selectionItems = await SelectionItem.findAll({
            include: [{ model: Item }],
            where: {
                selection_id: { [Op.in]: selections },
            },
            order: [['id', 'ASC']],
        })

        const resultSelections = []
        const pSelection = selectionItems.map(async (selection, i) => {
            const itemSelections = await _getSelections('device', selection.item_id, project_id, selectionsArr)
            const alertsCount = await _getAlerts(req.user.organization.blockchain_name, itemSelections, project_id, selection.item_id, sealingChecked, temperatureChecked, humidityChecked, 'item', elm_id, tamperChecked)
            selection.dataValues.alert = alertsCount
            resultSelections.push(selection)
        })
        await Promise.all(pSelection)

        res.json(resultSelections)
    } catch (err) {
        res.json(err)
    }
})

router.post('/fetch-devices', async (req, res) => {
    try {
        const { project_id, selections: selectionsArr, elm_id, sealingChecked, temperatureChecked, humidityChecked, tamperChecked } = req.body
        const resultDevices = []
        let { selections } = req.body
        if (elm_id && elm_id != 'null') selections = await _getSelections('device', elm_id, 0, selectionsArr)
        const selectionDevice = await SelectionDevice.findAll({
            include: [{ model: Device }],
            where: {
                selection_id: { [Op.in]: selections },
            },
            order: [['id', 'ASC']],
        })
        const pSelection = selectionDevice.map(async (device) => {
            const itemSelectionIds = await _getSelections('device', elm_id, project_id, selectionsArr)
            const alertsCount = await _getAlerts(req.user.organization.blockchain_name, itemSelectionIds, project_id, device.device_id, sealingChecked, temperatureChecked, humidityChecked, 'device', elm_id, tamperChecked)
            device.dataValues.alert = alertsCount
            resultDevices.push(device)
        })
        await Promise.all(pSelection)
        res.json(resultDevices)
    } catch (err) {
        res.json(err)
    }
})

const _getSelections = async (elm_type = 'project', elm_id = 0, project_id, projectSelections = []) => {
    try {
        let selectionsArr = []
        let selections = []
        switch (elm_type) {
            case 'project':
                // In case no dropdown selected
                selections = await ProjectSelection.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('id')), 'id']],
                    where: { project_id },
                    group: ['project_id'],
                })
                selectionsArr = selections[0].id.split(',')
                break

            case 'truck':
                const groupWhereObj = { selection_id: { [Op.in]: projectSelections } }
                if (elm_id) groupWhereObj.group_id = elm_id
                selections = await SelectionGroup.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('selection_id')), 'selection_id']],
                    where: groupWhereObj,
                    group: ['group_id'],
                })
                if (elm_id) selectionsArr = selections.length > 0 ? selections[0].selection_id.split(',') : []
                else selectionsArr = selections.length > 0 ? selections.map((selection) => selection.selection_id.split(',')) : []
                break

            case 'container':
                const truckWhereObj = { selection_id: { [Op.in]: projectSelections } }
                if (elm_id) truckWhereObj.truck_id = elm_id
                selections = await SelectionTruck.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('selection_id')), 'selection_id']],
                    where: truckWhereObj,
                    group: ['truck_id'],
                })
                if (elm_id) selectionsArr = selections.length > 0 ? selections[0].selection_id.split(',') : []
                else selectionsArr = selections.length > 0 ? selections.map((selection) => selection.selection_id.split(',')) : []
                break

            case 'item':
                const containerWhereObj = { selection_id: { [Op.in]: projectSelections } }
                if (elm_id) containerWhereObj.container_id = elm_id
                selections = await SelectionContainer.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('selection_id')), 'selection_id']],
                    where: containerWhereObj,
                    group: ['container_id'],
                })
                if (elm_id) selectionsArr = selections.length > 0 ? selections[0].selection_id.split(',') : []
                else selectionsArr = selections.length > 0 ? selections.map((selection) => selection.selection_id.split(',')) : []
                break

            case 'device':
                const itemWhereObj = { selection_id: { [Op.in]: projectSelections } }
                if (elm_id) itemWhereObj.item_id = elm_id
                selections = await SelectionItem.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('selection_id')), 'selection_id']],
                    where: itemWhereObj,
                    group: ['item_id'],
                })
                if (elm_id) selectionsArr = selections.length > 0 ? selections[0].selection_id.split(',') : []
                else selectionsArr = selections.length > 0 ? selections.map((selection) => selection.selection_id.split(',')) : []
                break
            case 'itemDevice':
                selections = await SelectionDevice.findAll({
                    attributes: [[db.Sequelize.fn('GROUP_CONCAT', db.Sequelize.col('selection_id')), 'selection_id']],
                    where: {
                        device_id: elm_id,
                        selection_id: { [Op.in]: projectSelections },
                    },
                    group: ['device_id'],
                })
                if (elm_id) selectionsArr = selections.length > 0 ? selections[0].selection_id.split(',') : []
                else selectionsArr = selections.length > 0 ? selections.map((selection) => selection.selection_id.split(',')) : []
                break
        }
        return selectionsArr
    } catch (err) {
        console.log(err)
    }
}

const _getAlerts = async (organizationName, selections, project_id, elm_id, sealingChecked, temperatureChecked, humidityChecked, type, elem_id, tamperChecked) => {
    try {
        const MProjectEvent = await mdb.project_event(organizationName)
        let whereEventTemp = { event_id: process.env.tempAlertEventId, project_id: parseInt(project_id) }
        let whereEventhumdity = { event_id: process.env.humidityAlertEventId, project_id: parseInt(project_id) }
        let whereSealing = { project_id }
        let whereTamper = { project_id }

        const relFields = {
            group: { group_id: elm_id },
            truck: { group_id: elem_id, truck_id: elm_id },
            container: { truck_id: elem_id, container_id: elm_id },
            item: { container_id: elem_id, item_id: elm_id },
            device: { item_id: elem_id, device_id: elm_id },
        }

        Object.keys(relFields).map((k) => {
            Object.keys(relFields[k]).map((j) => {
                if (!relFields[k][j] || relFields[k][j] == 'null' || relFields[k][j] == 'undefined') {
                    delete relFields[k][j]
                }
            })
        })
        const selectionItems = await SelectionItem.findAll({
            include: [{ model: Item }],
            where: {
                selection_id: { [Op.in]: selections },
            },
            group: ['item_id'],
            order: [['id', 'ASC']],
        })

        const item_ids = []
        selectionItems.map((sItem) => {
            item_ids.push(sItem.item_id)
        })

        if (relFields[type] !== 'undefined') {
            whereEventhumdity = Object.assign(whereEventhumdity, relFields[type], { item_id: { $in: item_ids } })
            whereEventTemp = Object.assign(whereEventTemp, relFields[type], { item_id: { $in: item_ids } })
            whereSealing = Object.assign(whereSealing, relFields[type], { item_id: { [Op.in]: item_ids } })
            whereTamper = Object.assign(whereTamper, relFields[type], { item_id: { [Op.in]: item_ids } })
        }

        const temp = await MProjectEvent.aggregate([
            { $match: whereEventTemp },
            {
                $group: {
                    _id: '$item_id',
                },
            },
        ]).exec()

        const hum = await MProjectEvent.aggregate([
            { $match: whereEventhumdity },
            {
                $group: {
                    _id: '$item_id',
                },
            },
        ]).exec()

        const sealAlerts = await SealingDetail.findAll({
            attributes: ['id'],
            where: whereSealing,
            group: ['item_id'],
        })
        let tamperAlertsCountRef = 0
        const tamperAlerts = await TamperDetail.findOne({
            attributes: ['status'],
            where: whereTamper,
            group: ['item_id'],
            order: [['id', 'DESC']],
        })
        if (tamperAlerts) {
            whereTamper.status = tamperAlerts.status
            tamperAlertsCountRef = await TamperDetail.findAll({
                attributes: ['status'],
                where: whereTamper,
                group: ['item_id'],
                order: [['id', 'DESC']],
            })
        }
        const tempCount = temp.length > 0 && temperatureChecked ? temp.length : 0
        const humCount = hum.length > 0 && humidityChecked ? hum.length : 0
        const sealAlertsCount = sealAlerts.length > 0 && sealingChecked ? sealAlerts.length : 0
        const tamperAlertsCount = tamperAlertsCountRef.length > 0 && tamperChecked ? tamperAlertsCountRef.length : 0
        const alertCount = tempCount + humCount + sealAlertsCount + tamperAlertsCount

        return alertCount
    } catch (err) {
        console.log({ error: err.message || err.toString() })
    }
}

// Add Device code
router.post('/add', async (req, res) => {
    try {
        const project = await Project.create({
            name: req.body.name,
            project_category_id: req.body.project_category_id,
            document_category_id: req.body.document_category_id,
            temperature_alert_min: req.body.temperature_alert_min,
            temperature_alert_max: req.body.temperature_alert_max,
            temperature_alert_interval: req.body.temperature_alert_interval,
            temperature_allowed_occurances: req.body.temperature_allowed_occurances,
            humidity_alert_min: req.body.humidity_alert_min,
            humidity_alert_max: req.body.humidity_alert_max,
            humidity_alert_interval: req.body.humidity_alert_interval,
            humidity_allowed_occurances: req.body.humidity_allowed_occurances,
            ambience_threshold: req.body.ambience_threshold,
            isDraft: req.body.isDraft,
            alert_type: req.body.alert_type,
            pdc_name: req.body.pdcName,
            custom_labels: req.body.custom_labels,
            isActive: req.body.isDraft,
            user_id: req.user.id,
            archived: 0,
            is_readonly: 0,
        })
        if (project) {
            await _addProjectSelectionData(req, project.id)

            if (!req.body.isDraft) {
                // Add PDC request in queue
                await PdcRequests.create({
                    pdc_name: req.body.pdcName,
                    members: req.body.members,
                    type: 1,
                    email: true,
                    record_id: project.id,
                    user_id: req.user.id,
                })
                if (process.env.dev != 'true') {
                    await networkHelper.addProjectToNetwork(req, project.id, project.uniqueId)
                }
            }
            res.json(project)
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Project code
router.post('/update', async (req, res) => {
    try {
        await _makeResourceAvailable(req.body.id)
        await ProjectRoad.destroy({ where: { project_id: req.body.id } })
        await ProjectParticipant.destroy({ where: { project_id: req.body.id } })
        await ProjectSelection.destroy({ where: { project_id: req.body.id } })
        await ProjectUser.destroy({ where: { project_id: req.body.id } })

        Project.update(
            {
                name: req.body.name,
                project_category_id: req.body.project_category_id,
                document_category_id: req.body.document_category_id,
                temperature_alert_min: req.body.temperature_alert_min,
                temperature_alert_max: req.body.temperature_alert_max,
                temperature_alert_interval: req.body.temperature_alert_interval,
                temperature_allowed_occurances: req.body.temperature_allowed_occurances,
                humidity_alert_min: req.body.humidity_alert_min,
                humidity_alert_max: req.body.humidity_alert_max,
                humidity_alert_interval: req.body.humidity_alert_interval,
                humidity_allowed_occurances: req.body.humidity_allowed_occurances,
                ambience_threshold: req.body.ambience_threshold,
                draft: req.body.draft,
                alert_type: req.body.alert_type,
                custom_labels: req.body.custom_labels,
            },
            { where: { id: req.body.id } },
        ).then(async function (project) {
            if (project) {
                await _addProjectSelectionData(req, req.body.id)
                cronHelper.cronRestartApi().then(() => {})

                if (req.body.draft) {
                    // Add PDC request in queue
                    await PdcRequests.create({
                        pdc_name: req.body.pdcName,
                        members: req.body.members,
                        type: 1,
                        email: false,
                        record_id: req.body.id,
                        user_id: req.user.id,
                    })
                }

                res.json(project)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/start-item-tracking', async (req, res) => {
    try {
        const { item_id, project_id } = req.body
        const projectSelection = await ProjectSelection.findOne({
            include: [
                {
                    model: SelectionItem,
                    where: { item_id },
                },
            ],
            where: {
                project_id,
            },
        })
        await Project.update(
            {
                isActive: 1,
            },
            {
                where: {
                    id: project_id,
                },
            },
        )
        if (projectSelection && projectSelection.selection_items && projectSelection.selection_items[0].is_start) {
            res.json({ projectSelection, isAlreadyStarted: true })
        } else {
            // Change is_start flag
            SelectionItem.update(
                {
                    is_start: 1,
                    start_date_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                },
                {
                    where: {
                        item_id,
                        selection_id: projectSelection.id,
                    },
                },
            ).then(async function (result) {
                if (result) {
                    // add cron and start it
                    await _updateCron(project_id, item_id)
                    const updatedItem = await SelectionItem.findOne({ where: { item_id, selection_id: projectSelection.id } })
                    res.json({ updatedItem, isAlreadyStarted: false })
                }
            })
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Update Cron
const _updateCron = async (project_id, item_id, is_stop) => {
    try {
        const participants = await ProjectParticipant.findAll({
            include: Organization,
            where: {
                project_id,
            },
        })
        const participantCron = await participants.map(async (org) => {
            const org_name = org.organization.blockchain_name
            if (item_id) {
                await _startItemTracking({ project_id, item_id })
            } else {
                await _stopCron({ id: project_id })
                if (!is_stop) await _startCron({ id: project_id })
            }
        })
        await Promise.all(participantCron)
    } catch (err) {
        console.log(err)
    }
}

const _startCron = async (data) =>
    networkHooks.sendAbsoluteRequest(`${CRON_URL}/restart-cron`, {
        body: JSON.stringify(data),
    })

const _stopCron = async (data) =>
    networkHooks.sendAbsoluteRequest(`${CRON_URL}/restart-cron`, {
        body: JSON.stringify(data),
    })

const _startItemTracking = async (data) =>
    networkHooks.sendAbsoluteRequest(`${CRON_URL}/start-item-tracking`, {
        body: JSON.stringify(data),
    })

// Add project selection data
const _addProjectSelectionData = async (req, project_id) => {
    try {
        const isDraft = req.body.draft
        // Stations
        const projectRoad = []
        const { selectedRoads } = req.body
        for (let i = 0; i < selectedRoads.length; i++) {
            projectRoad.push({
                project_id,
                road_id: selectedRoads[i].road_id,
                radius: selectedRoads[i].radius,
                paths: Array.isArray(selectedRoads[i].pathArray) && selectedRoads[i].pathArray.length ? JSON.stringify(selectedRoads[i].pathArray) : selectedRoads[i].paths || null,
                order: i + 1,
            })
        }
        await ProjectRoad.bulkCreate(projectRoad)

        // Participants
        const projectParticipants = await ProjectParticipantCategories.findAll({
            include: [
                {
                    model: ParticipantCategories,
                    include: [{ model: OrganizationCategories }],
                },
            ],
            where: {
                project_category_id: req.body.project_category_id,
            },
        })

        let projectOrganizatoinsArr = []
        if (projectParticipants) {
            projectParticipants.map((pCategory) => {
                pCategory.participant_category.organization_categories.map((category) => {
                    const ifExists = projectOrganizatoinsArr.find((cat) => cat.participant_id == category.org_id)
                    if (!ifExists) {
                        projectOrganizatoinsArr.push({
                            project_id,
                            participant_id: category.org_id,
                        })
                    }
                })
            })
        }

        const ifParticipantExists = await ProjectParticipant.findAll({
            attributes: ['project_id', 'participant_id'],
        })

        ifParticipantExists.map((p) => {
            const pIndex = projectOrganizatoinsArr.findIndex((po) => po.project_id == p.project_id && po.participant_id == p.participant_id)
            if (pIndex > -1) {
                projectOrganizatoinsArr = projectOrganizatoinsArr.splice(pIndex, 1)
            }
        })

        if (projectOrganizatoinsArr.length) {
            await ProjectParticipant.bulkCreate(projectOrganizatoinsArr)
        }

        // Add project users
        const projectUsersArr = []
        const pUsers = projectOrganizatoinsArr.map(async (organization) => {
            const orgUsers = await Users.findAll({
                where: {
                    organization_id: organization.participant_id,
                },
            })
            if (orgUsers) {
                orgUsers.map((user) => {
                    projectUsersArr.push({
                        project_id,
                        user_id: user.id,
                    })
                })
            }
        })
        await Promise.all(pUsers)
        if (projectUsersArr) {
            await ProjectUser.bulkCreate(projectUsersArr)
        }

        for (const selection of req.body.selections) {
            const project_selection = await ProjectSelection.create({
                project_id,
            })
            const alertArray = _.map(selection.selectionTemperatureArray, (selectiontemprature, i) => {
                let alertselectionId = 3
                if (selectiontemprature.selectionId == '1' && selection.group_id != '1') {
                    alertselectionId = selectiontemprature.selectionId
                }
                if (selectiontemprature.selectionId == '2' && selection.truck_id != '1') {
                    alertselectionId = selectiontemprature.selectionId
                }
                if (selectiontemprature.selectionId == '5' && selection.devices.length && selection.devices[0].device_id) {
                    alertselectionId = selectiontemprature.selectionId
                }

                return {
                    project_id,
                    selection_id: project_selection.id,
                    selection_element: alertselectionId,
                    device_id: selectiontemprature.device_id || 0,
                    changed_selection: selectiontemprature.changed_selection,
                    temperature_alert_min: selectiontemprature.temperature_alert_min,
                    temperature_alert_max: selectiontemprature.temperature_alert_max,
                    temperature_alert_interval: selectiontemprature.temperature_alert_interval,
                    temperature_allowed_occurances: selectiontemprature.temperature_allowed_occurances,
                    humidity_alert_min: selectiontemprature.humidity_alert_min,
                    humidity_alert_max: selectiontemprature.humidity_alert_max,
                    humidity_alert_interval: selectiontemprature.humidity_alert_interval,
                    humidity_allowed_occurances: selectiontemprature.humidity_allowed_occurances,
                    ambience_threshold: selectiontemprature.ambience_threshold,
                }
            })
            await ProjectAlert.bulkCreate(alertArray)
            const isDeviceAvailable = Array.isArray(selection.devices) && selection.devices.length && selection.devices.some((d) => d.device_id)
            if (!isDeviceAvailable) {
                cronHelper.cronRestartApi().then(() => {})
            }
            await SelectionItem.create({
                selection_id: project_selection.id,
                item_id: selection.item_id,
                is_start: isDeviceAvailable ? selection.item_is_start : null,
                start_date_time: isDeviceAvailable ? selection.item_start_date_time : null,
            })

            await Item.update({ is_available: 0 }, { where: { id: selection.item_id } })

            await SelectionContainer.create({
                selection_id: project_selection.id,
                container_id: selection.container_id,
            })

            await Container.update({ is_available: 0 }, { where: { id: selection.container_id } })

            await SelectionTruck.create({
                selection_id: project_selection.id,
                truck_id: selection.truck_id,
            })

            await Truck.update({ is_available: 0 }, { where: { id: selection.truck_id } })

            await SelectionGroup.create({
                selection_id: project_selection.id,
                group_id: selection.group_id,
            })

            await Group.update({ is_available: 0 }, { where: { id: selection.group_id } })

            if (isDeviceAvailable) {
                const deviceData = []
                const devices = selection.devices.map(async ({ device_id = null, tag = '' }) => {
                    if (device_id) {
                        await Device.update({ tag, is_available: isDraft ? 1 : 0 }, { where: { id: device_id } })
                        deviceData.push({
                            selection_id: project_selection.id,
                            device_id,
                            is_started: !!selection.item_is_start,
                            data_interval: 4,
                        })
                    }
                })
                await Promise.all(devices)
                await SelectionDevice.bulkCreate(deviceData)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

// Make resources available
const _makeResourceAvailable = async (project_id, for_device_only = false) => {
    const selections = await ProjectSelection.findAll({
        where: { project_id },
    })

    const pArray = selections.map(async (selection, i) => {
        // do not delete all selections for complete and archive
        if (!for_device_only) {
            // Group
            const selectionGroup = await SelectionGroup.findOne({
                where: { selection_id: selection.id },
            })
            if (selectionGroup) {
                await Group.update({ is_available: 1 }, { where: { id: selectionGroup.group_id } })
            }

            // Truck
            const selectiontruck = await SelectionTruck.findOne({
                where: { selection_id: selection.id },
            })
            if (selectiontruck) {
                await Truck.update({ is_available: 1 }, { where: { id: selectiontruck.truck_id } })
            }

            // Container
            const selectioncontainer = await SelectionContainer.findOne({
                where: { selection_id: selection.id },
            })
            if (selectioncontainer) {
                await Container.update({ is_available: 1 }, { where: { id: selectioncontainer.container_id } })
            }

            // Item
            const selectionitem = await SelectionItem.findOne({
                where: { selection_id: selection.id },
            })
            if (selectionitem) {
                await Item.update({ is_available: 1 }, { where: { id: selectionitem.item_id } })
            }
        }

        // Device
        const selectionDevices = await SelectionDevice.findAll({
            where: { selection_id: selection.id },
        })
        const deviceIds = []
        if (selectionDevices.length) {
            selectionDevices.map((device) => deviceIds.push(device.device_id))
        }
        if (deviceIds.length) {
            await Device.update({ is_available: 1 }, { where: { id: { [Op.in]: deviceIds } } })
        }
    })
    return await Promise.all(pArray)
}

// Remove Project code
router.post('/remove', async (req, res) => {
    try {
        const { id } = req.body
        const result = await Project.update(
            {
                archived: true,
            },
            {
                where: { id },
            },
        )

        await ProjectSidebarFolders.destroy({ where: { project_id: id } })
        await ProjectFolder.destroy({ where: { project_id: id } })

        res.json(result)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove the Template
router.post('/remove-template', async (req, res) => {
    try {
        const template = await Project.destroy({
            where: {
                id: req.body.id,
            },
        })
        res.json(template)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})
// Project restore from archived
router.post('/restore', async (req, res) => {
    try {
        Project.update(
            {
                archived: false,
                is_readonly: true,
            },
            {
                where: {
                    id: req.body.id,
                },
            },
        ).then(function (result) {
            if (result) {
                res.json(result)
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/complete', async (req, res) => {
    try {
        const result = await Project.update(
            {
                is_completed: 1,
                completed_date: moment().format('YYYY-MM-DD HH:mm:ss'),
            },
            {
                where: {
                    id: req.body.id,
                },
            },
        )

        _makeResourceAvailable(req.body.id, true)
        // stop cron
        await Notification.destroy({ where: { project_id: req.body.id } })
        await DeviceApiLog.destroy({ where: { project_id: req.body.id } })
        await projectEventHelper.projectCompleteEvent(req, req.body.id, req.body.user_id, req.body.organization_id)
        cronHelper.cronRestartApi().then(() => {})
        res.json(result)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/* Project Folder Relate APIs -- Start */
router.get('/fetch-sidebar-folders', async (req, res) => {
    try {
        const queryOptions = {
            attributes: ['project_id'],
            include: [{ attributes: [], model: Project, where: { archived: false } }],
            where: {
                user_id: req.session.passport.user,
            },
        }

        Model._validateIncludedElements.bind(ProjectUser)(queryOptions)
        const tempSQL = db.sequelize.dialect.queryGenerator.selectQuery('project_users', queryOptions, ProjectUser).slice(0, -1) // to remove the ';' from the end of the SQL

        const ids = await ProjectSidebarFolders.findAll({
            attributes: ['id', 'parent'],
            where: {
                project_id: {
                    [Op.in]: db.sequelize.literal(`(${tempSQL})`),
                },
            },
        })

        const subFolder = await ProjectSidebarFolders.findAll({
            attributes: ['id', 'parent'],
            where: {
                project_id: null,
            },
        })

        const projFolderIds = _.uniq([...ids.map((i) => i.id), ...ids.map((i) => i.parent), ...subFolder.map((sf) => sf.id), ...subFolder.map((sf) => sf.parent)])
        const folders = await Users.findAll({
            attributes: [['username', 'name'], 'id'],
            include: [
                {
                    model: Project,
                    attributes: ['name', 'id', ['id', 'project_id']],
                    include: [
                        {
                            model: ProjectUser,
                            where: {
                                user_id: req.session.passport.user,
                            },
                            required: true,
                        },
                    ],
                    where: {
                        isDraft: { [Op.ne]: 1 },
                        archived: 0,
                        isActive: 1,
                    },
                },
                {
                    model: ProjectSidebarFolders,
                    where: {
                        id: { [Op.in]: projFolderIds },
                    },
                },
                {
                    model: Organization,
                    attributes: [['name', 'organisationaName']],
                    required: true,
                    where: {
                        isDeleted: 0,
                    },
                },
            ],
            where: {
                role_id: { [Op.in]: [process.env.ROLE_ADMIN, process.env.ROLE_MANAGER] },
            },
        })

        res.json(folders)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/create-sidebar-folder', (req, res) => {
    try {
        ProjectSidebarFolders.create({
            parent: req.body.parent,
            name: req.body.name,
            user_id: req.body.user_id,
        })
            .then(function (result) {
                if (result) {
                    res.json(result)
                }
            })
            .catch((err) => {
                res.json({ error: err.message || err.toString() })
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/remove-folder', (req, res) => {
    try {
        ProjectFolder.destroy({
            where: { id: req.body.id },
        }).then((result) => {
            if (result) {
                ProjectFolder.destroy({
                    where: { parent: req.body.id },
                }).then((result) => {
                    res.json(result)
                })
            } else {
                res.json(result)
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/remove-sidebar-folder', (req, res) => {
    try {
        ProjectSidebarFolders.destroy({
            where: { id: req.body.id },
        }).then((result) => {
            ProjectSidebarFolders.destroy({
                where: { parent: req.body.id },
            }).then((result) => {
                res.json(result)
            })
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/update-sidebar-folder', (req, res) => {
    try {
        ProjectSidebarFolders.update(
            {
                name: req.body.name,
            },
            {
                where: {
                    id: req.body.id,
                },
            },
        ).then(function (result) {
            if (result) {
                res.json(result)
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/update-folder', (req, res) => {
    try {
        ProjectFolder.update(
            {
                name: req.body.name,
            },
            {
                where: {
                    id: req.body.id,
                },
            },
        ).then(function (result) {
            if (result) {
                res.json(result)
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/update-sidebar-project-position', async (req, res) => {
    try {
        const { positions, type } = req.body
        await positions.map(async (p) => {
            let whereObj = {}
            if (type == 'project') {
                whereObj = {
                    project_id: p.id,
                }
            } else {
                whereObj = {
                    id: p.id,
                }
            }
            await ProjectSidebarFolders.update(
                {
                    position: p.position,
                },
                {
                    where: whereObj,
                },
            )
        })
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

router.post('/assign-project-sidebar-folder', async (req, res) => {
    try {
        const project = await ProjectSidebarFolders.findOne({
            where: { project_id: req.body.project_id },
        })
        if (project) {
            await ProjectSidebarFolders.destroy({ where: { project_id: req.body.project_id } })
        }
        ProjectSidebarFolders.create({
            parent: req.body.parent,
            project_id: req.body.project_id,
            user_id: req.body.user_id,
            name: req.body.name,
        }).then(function (result) {
            if (result) {
                res.json(result)
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/remove-project-sidebar-folder', async (req, res) => {
    try {
        const projectFolder = await ProjectSidebarFolders.findOne({
            where: {
                id: req.body.id,
                // parent: req.body.parent,
            },
        })

        if (projectFolder) {
            await ProjectSidebarFolders.destroy({
                where: {
                    id: req.body.id,
                    // parent: req.body.parent,
                },
            })
        }
        res.json(string.apiResponses.projectFolderDeleteSuccess)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/recent-project', async (req, res) => {
    try {
        const project = await ProjectUser.findOne({
            include: [
                {
                    model: Project,
                    required: true,
                    where: {
                        isDraft: 0,
                    },
                },
            ],
            where: {
                user_id: req.body.user_id,
            },
            order: [['id', 'DESC']],
        })
        if (project) {
            res.json(project)
        } else {
            res.json({})
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All Project List Only
router.get('/fetch-project-list', async (req, res) => {
    try {
        const projects = await ProjectUser.findAll({
            include: [
                {
                    model: Project,
                    where: {
                        archived: false,
                        is_completed: false,
                    },
                },
            ],
            where: {
                user_id: req.user.id,
            },
            order: [[db.projects, 'id', 'DESC']],
        })

        const projectsAry = []
        if (projects) {
            projects.map((project, i) => {
                projectsAry.push(project.project)
            })
        }
        res.json(projectsAry)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
