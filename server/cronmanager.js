const cronJobs = []
let singleCronJobs = []
const eventsCron = []
const cron = require('node-cron')
const { forEach } = require('async-foreach')
const _ = require('lodash')
// Load MySQL Models
const db = require('./models')

const Project = db.projects
const ProjectSelection = db.project_selections
const SelectionGroup = db.selection_groups
const SelectionTruck = db.selection_trucks
const SelectionContainer = db.selection_containers
const SelectoinItem = db.selection_items
const SelectionDevice = db.selection_devices
const Device = db.devices
const Groups = db.groups
const Items = db.items
const Containers = db.containers
const Trucks = db.trucks
const DeviceVendor = db.device_vendors
const ProjectRoad = db.project_roads
const Station = db.stations
const ProjectUser = db.project_users
const ProjectAlerts = db.project_alerts
const Invitation = db.invitation
const Organization = db.organizations
const User = db.users
const { Op } = db.Sequelize
const cronapp = require('./cronapp.js')
const helper = require('./helpers/cron-helper.js')
const projectEventHelper = require('./helpers/project-event-helper.js')
const { sendOnboardingCancelEmail, sendOnboardingCancelEmailOrg } = require('./utils/emailHelpers')
const { getAccess, callNetworkApi } = require('./utils/IPFSHelpers')

const { tempAlertEventId } = process.env // Temperature alert event id
const { humidityAlertEventId } = process.env // Humidity alert event id
const adminUserId = process.env.ADMIN_USER_ID // Admin user id, it will be used to log events

async function runCronJob() {
    try {
        // Get projects with active tracking with their devices and start cron jobs for all projects
        const projects = await Project.findAll({
            include: [
                {
                    model: ProjectSelection,
                    include: [
                        {
                            model: SelectionGroup,
                            include: [
                                {
                                    model: Groups,
                                    attributes: ['groupID'],
                                },
                            ],
                        },
                        {
                            model: SelectionTruck,
                            include: [
                                {
                                    model: Trucks,
                                    attributes: ['truckID'],
                                },
                            ],
                        },
                        {
                            model: SelectionContainer,
                            include: [
                                {
                                    model: Containers,
                                    attributes: ['containerID'],
                                },
                            ],
                        },
                        {
                            model: SelectoinItem,
                            where: {
                                is_start: 1,
                            },
                            include: [
                                {
                                    model: Items,
                                    attributes: ['itemID'],
                                },
                            ],
                        },
                        {
                            model: SelectionDevice,
                            include: [
                                {
                                    model: Device,
                                    include: [
                                        {
                                            model: DeviceVendor,
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            model: ProjectAlerts,
                        },
                    ],
                },
                {
                    model: ProjectRoad,
                    include: [{ model: Station }],
                },
                {
                    model: ProjectUser,
                    include: [
                        {
                            model: User,
                            where: { isApproved: 1, isDeleted: 0 },
                            attributes: ['organization_id', 'role_id'],
                        },
                    ],
                },
            ],
            where: {
                '$project_selections.selection_items.is_start$': 1,
                isDraft: 0,
                is_completed: 0,
            },
        })
        const activeProjects = []
        await projects.forEach(async (project, i) => {
            const project_id = project.id
            cronJobs[project_id] = []
            const availableProject = await _runCronJob(project, cronJobs, 0)
            if (availableProject && availableProject.length) {
                activeProjects.push(availableProject)
            }
        })
        if (activeProjects.length) {
            singleCronJobs = []
            runSingleCron(activeProjects)
        }

        // Get all temp network events and send them to network
        const eventCron = cron.schedule(
            '*/1 * * * *',
            async () => {
                await projectEventHelper.sendEventToNetwork()
            },
            { name: 'event cron' },
        )
        eventsCron.push(eventCron)
    } catch (error) {
        console.error('Error in runCronJob:', error)
    }
}

async function runSingleCron(array) {
    try {
        const vendorArray = array.map((a) => a.map((b) => b.device_vendor))
        const keysList = _.uniq([].concat.apply([], vendorArray))
        const cronObject = {}
        keysList.forEach((key) => {
            cronObject[key] = array.filter((a) => a.filter((d) => d.device_vendor == key))
        })
        const singleTaskCron = cron.schedule(
            `*/4 * * * *`,
            () => {
                if (_.size(cronObject)) {
                    _.forEach(cronObject, (data, key) => {
                        cronapp.fetchData(key, data, adminUserId)
                    })
                }
            },
            { name: 'singlecron' },
        )
        singleCronJobs.push(singleTaskCron)
    } catch (err) {
        console.log(err)
    }
}

async function addCronJob() {
    try {
        await restartCron()
    } catch (error) {
        console.error('Error in addCronJob:', error)
    }
}

async function _runCronJob(project, cronJobs, runFirstTime) {
    try {
        const project_id = project.id
        const { alert_type } = project
        const projectDevices = []

        const { temperature_alert_interval } = project
        const { temperature_allowed_occurances } = project
        const { humidity_alert_interval } = project
        const { humidity_allowed_occurances } = project

        project.project_selections.forEach((project_selection, j) => {
            if (project_selection.selection_devices.length > 0 && project_selection.selection_items[0].is_start) {
                const { item_id, item } = project_selection.selection_items[0]
                cronJobs[project_id] = []
                let projectAlerts = {}

                const selectionElements = {
                    group_id: project_selection.selection_groups[0].group_id,
                    truck_id: project_selection.selection_trucks[0].truck_id,
                    container_id: project_selection.selection_containers[0].container_id,
                    item_id,
                    groupName: project_selection.selection_groups[0].group.groupID,
                    truckName: project_selection.selection_trucks[0].truck.truckID,
                    containerName: project_selection.selection_containers[0].container.containerID,
                    itemName: item.itemID,
                }
                // 1 = per project, 2 = per unit
                let valuesObj = {
                    min_temp: project.temperature_alert_min,
                    max_temp: project.temperature_alert_max,
                    min_hum: project.humidity_alert_min,
                    max_hum: project.humidity_alert_max,
                    sealing_point: project.ambience_threshold,
                }

                // Run it for the first time to fetch data
                _.forEach(project_selection.selection_devices, (device) => {
                    const deviceData = device.device
                    const newselectionElements = Object.assign({}, selectionElements, { device_id: device.device_id, deviceName: device.device.deviceID, deviceTag: device.device.tag || '' })

                    if (alert_type == '2') {
                        projectAlerts = project_selection.project_alerts.find((alert) => alert.device_id == device.device_id)
                        if (!projectAlerts) {
                            const alert = project_selection.project_alerts.filter((alert) => !alert.device_id)
                            if (alert.length) {
                                projectAlerts = alert[alert.length - 1]
                                valuesObj = {
                                    min_temp: projectAlerts.temperature_alert_min,
                                    max_temp: projectAlerts.temperature_alert_max,
                                    min_hum: projectAlerts.humidity_alert_min,
                                    max_hum: projectAlerts.humidity_alert_max,
                                    sealing_point: projectAlerts.ambience_threshold,
                                }
                            }
                        }
                    }

                    if (device && deviceData && deviceData.device_vendor) {
                        if (runFirstTime) {
                            const obj = { deviceID: deviceData.deviceID, device_vendor: deviceData.device_vendor.api_key, valuesObj, project, selection_elements: newselectionElements }
                            cronapp.fetchData(deviceData.device_vendor.api_key, obj, adminUserId)
                        }
                        projectDevices.push({ deviceID: deviceData.deviceID, device_vendor: deviceData.device_vendor.api_key, valuesObj, project, selection_elements: JSON.parse(JSON.stringify(newselectionElements)) })
                    }
                })
            }
        })
        if (projectDevices.length) {
            const task_temp_alert = cron.schedule(
                `*/${temperature_alert_interval} * * * *`,
                () => {
                    _.forEach(projectDevices, (device) => {
                        helper.verifyOccurancesAndAddToProjectEvent(project, adminUserId, tempAlertEventId, temperature_allowed_occurances, JSON.parse(JSON.stringify(device.selection_elements)), 10)
                    })
                },
                { name: `temprature_${project.id}` },
            )
            cronJobs[project_id].push(task_temp_alert)

            const task_humidity_alert = cron.schedule(
                `*/${humidity_alert_interval} * * * *`,
                () => {
                    _.forEach(projectDevices, (device) => {
                        helper.verifyOccurancesAndAddToProjectEvent(project, adminUserId, humidityAlertEventId, humidity_allowed_occurances, JSON.parse(JSON.stringify(device.selection_elements)), 20)
                    })
                },
                { name: `humidit_${project.id}` },
            )
            cronJobs[project_id].push(task_humidity_alert)
        }
        return projectDevices
    } catch (error) {
        console.error('Error in _runCronJob', error)
    }
}

async function restartCron() {
    try {
        // console.log('cronJobs --> ', cron.getTasks().size)
        // const tasks = cron.getTasks()
        // tasks.forEach((task, k) => {
        //     task.stop()
        // })
        // console.log('cronJobs --> ', cron.getTasks().size)
        // await runCronJob()
    } catch (err) {
        console.log(err)
    }
}

async function getCronJobs() {
    console.log('cronJobs --> ', cronJobs)
    console.log('singleCronJobs --> ', singleCronJobs)
    console.log('eventsCron --> ', eventsCron)
    return cronJobs
}

async function checkExpiredInvitation() {
    cron.schedule('00 00 00 * * *', async () => {
        try {
            const organizationToRemove = await Organization.findAll({
                attributes: ['id', 'name'],
                where: {
                    isDeleted: 0,
                    isApproved: false,
                    createdAt: {
                        [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 7 * 1000), // 7 days
                    },
                },
                raw: true,
            })

            if (organizationToRemove.length === 0) {
                return
            }

            const organizations = await Organization.destroy({
                attributes: ['id', 'name'],
                where: {
                    isApproved: false,
                    createdAt: {
                        [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 7 * 1000), // 7 days
                    },
                },
                raw: true,
            })

            forEach(
                organizationToRemove,
                async function (org, index, arr) {
                    // Get access token
                    const accessToken = await getAccess(org.name)
                    if (accessToken.error) {
                        // throw accessToken.error;
                    }

                    // Remove data from IPFS
                    const ipfsDataObj = {
                        onboardingRequestID: `${org.name}-${org.id}`,
                        requestStatus: 'CANCELLED',
                    }

                    const ipfsResponse = await callNetworkApi(accessToken, 'orgOnboarding/reject-onboarding-request', ipfsDataObj, true)
                    if (!ipfsResponse.success) {
                        // throw ipfsResponse.error;
                    }

                    let user = await User.findOne({
                        where: {
                            organization_id: org.id,
                            isDeleted: 0,
                        },
                        raw: true,
                    })

                    if (!user) {
                        user = await Invitation.findOne({
                            where: {
                                organization_id: org.id,
                            },
                            raw: true,
                        })
                    }

                    if (user) {
                        await sendOnboardingCancelEmail(user.email, org.name)
                    }
                },
                (data) => console.log({ data }),
            )

            const users = await User.findAll({
                where: {
                    role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                    isDeleted: 0,
                },
                raw: true,
            })

            forEach(
                users,
                async function (user, index, arr) {
                    await sendOnboardingCancelEmailOrg(user.email, user.username)
                },
                (data) => console.log({ data }),
            )
        } catch (error) {
            console.log({ error })
        }
    })
}

exports.runCronJob = runCronJob
exports.getCronJobs = getCronJobs
exports.addCronJob = addCronJob
exports.restartCron = restartCron
exports.checkExpiredInvitation = checkExpiredInvitation
