const _ = require('lodash')
const db = require('../models')
const mdb = require('../models/mangoose/index.model')
const cronHelper = require('../helpers/cron-helper')
const { sendPdcRequestEmail } = require('../utils/emailHelpers')

const User = db.users
const Organization = db.organizations
const OrganizationCategories = db.organization_categories
const PdcRequests = db.pdc_request
const PdcOrgApprovals = db.pdc_org_approvals
const Project = db.projects
const ProjectParticipant = db.project_participants
const ProjectPdcCategory = db.project_pdc_categories
const ProjectUser = db.project_users
const Station = db.stations
const Item = db.items
const Container = db.containers
const TemperatureLog = db.temperature_logs
const HumidityLog = db.humidity_logs
const SealingDetail = db.sealing_details
const ProjectParticipantCategories = db.project_participant_categories
const ProjectSidebarFolders = db.project_sidebar_folders
const Op = db.Sequelize.Op

const addProjectParticipants = async (org_category_id, project_category_id) => {
    try {
        const categoryProjects = await Project.findAll({
            where: { project_category_id: project_category_id },
        })
        const organizationCategories = await OrganizationCategories.findAll({
            where: {
                category_id: org_category_id,
            },
            include: [
                {
                    model: Organization,
                    include: [{ model: User, where: { isDeleted: 0 } }],
                    required: true,
                    where: { isDeleted: 0 },
                },
            ],
        })

        if (organizationCategories) {
            const projectParticipantArr = []
            const projectUserArr = []

            const pSelections = organizationCategories.map(async (orgCategory, i) => {
                const participant = orgCategory.organization
                if (categoryProjects) {
                    const cSelections = categoryProjects.map(async (project) => {
                        const ifParticipantExists = await ProjectParticipant.findOne({
                            where: {
                                project_id: project.id,
                                participant_id: participant.id,
                            },
                        })

                        if (!ifParticipantExists) {
                            projectParticipantArr.push({
                                project_id: project.id,
                                participant_id: participant.id,
                            })
                            if (participant.users) {
                                const pSelections = participant.users.map(async (user) => {
                                    const ifExist = await ProjectUser.findOne({
                                        where: {
                                            project_id: project.id,
                                            user_id: user.id,
                                        },
                                    })
                                    if (!ifExist) {
                                        projectUserArr.push({
                                            project_id: project.id,
                                            user_id: user.id,
                                        })
                                    }
                                })
                                await Promise.all(pSelections)
                            }
                        }
                    })
                    await Promise.all(cSelections)
                }
            })

            await Promise.all(pSelections)
            if (projectParticipantArr.length) {
                await ProjectParticipant.bulkCreate(projectParticipantArr)
            }
            if (projectUserArr.length) {
                await ProjectUser.bulkCreate(projectUserArr)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

const removeProjectParticipants = async (org_category_id, project_category_id) => {
    try {
        const categoryProjects = await Project.findAll({
            where: { project_category_id: project_category_id },
        })
        const projectParticipantCategory = await ProjectParticipantCategories.findAll({
            attributes: ['participant_category_id'],
            where: { project_category_id: project_category_id },
            raw: true,
        })
        const availableParticipantCatId = projectParticipantCategory.map((part) => part.participant_category_id)

        const orgCategories = await OrganizationCategories.findAll({
            attributes: ['org_id'],
            where: { category_id: { [Op.in]: availableParticipantCatId } },
            raw: true,
        })
        const availableOrgs = orgCategories.map((orgs) => orgs.org_id)

        const participants = await OrganizationCategories.findAll({
            where: {
                category_id: org_category_id,
                org_id: { [Op.notIn]: availableOrgs },
            },
            include: [
                {
                    model: Organization,
                    where: { isDeleted: 0 },
                    include: [{ model: User, where: { isDeleted: 0 } }],
                    required: true,
                },
            ],
        })

        if (participants) {
            const pSelections = participants.map(async (data, i) => {
                const participant = data.organization
                if (categoryProjects) {
                    const cSelections = categoryProjects.map(async (project) => {
                        await ProjectParticipant.destroy({
                            where: {
                                project_id: project.id,
                                participant_id: participant.id,
                            },
                        })
                        if (participant.users) {
                            participant.users.map(async (user) => {
                                await ProjectUser.destroy({
                                    where: {
                                        project_id: project.id,
                                        user_id: user.id,
                                    },
                                })
                            })
                        }
                    })
                    await Promise.all(cSelections)
                }
            })
            await Promise.all(pSelections)
            await cronHelper.cronRestartApi()
        }
    } catch (err) {
        console.log(err)
    }
}

const updateOrgCategoryProjects = async (organization_id, participant_categories) => {
    try {
        const organizationUsers = await User.findAll({
            where: { organization_id, isDeleted: 0 },
        })

        // Add organization to projects
        const participantCategories = await ProjectParticipantCategories.findAll({
            where: { participant_category_id: { [Op.in]: participant_categories } },
            group: ['project_category_id'],
            raw: true,
        })

        // Remove old projects
        await ProjectParticipant.destroy({
            where: {
                participant_id: organization_id,
            },
        })

        const orgUserIds = _.uniqWith(
            organizationUsers.map((user) => user.id),
            _.isEqual,
        )
        if (organizationUsers.length) {
            await ProjectUser.destroy({
                where: {
                    user_id: { [Op.in]: orgUserIds },
                },
            })
        }

        if (!organizationUsers.length || !participantCategories.length) return false

        const projectUsersArr = []
        const projectParticipants = []
        if (participantCategories.length) {
            const categoryIds = participantCategories.map((projectCaterogy) => projectCaterogy.project_category_id)

            const categoryProjects = await Project.findAll({
                attributes: ['id'],
                where: {
                    project_category_id: { [Op.in]: _.uniq(categoryIds) },
                },
            })
            if (categoryProjects.length) {
                const categoryProjectData = categoryProjects
                // categoryProjectData.map((project) => {
                //     if (organizationUsers.length) {
                //         orgUserIds.map((user_id) => {
                //             projectUsersArr.push({ project_id: project.id, user_id })
                //         })
                //     }
                //     projectParticipants.push({ project_id: project.id, participant_id: organization_id })
                // })
                const data = categoryProjectData.map((project) => {
                    let projectUsersArr = []
                    if (organizationUsers.length) {
                        projectUsersArr = orgUserIds.map((user_id) => {
                            return { project_id: project.id, user_id }
                        })
                    }
                    return { projectParticipantArr: { project_id: project.id, participant_id: organization_id }, projectUsersArr }
                })
                await ProjectParticipant.bulkCreate(
                    [].concat.apply(
                        [],
                        data.map((a) => a.projectParticipantArr),
                    ),
                )
                await ProjectUser.bulkCreate(
                    [].concat.apply(
                        [],
                        data.map((a) => a.projectUsersArr),
                    ),
                )
            }
        }
        await cronHelper.cronRestartApi()

        return true
    } catch (err) {
        console.log(err)
    }
}

const addOrganizationStations = async (organization_id) => {
    try {
        const masterStations = await Station.findAll({ where: { organization_id: process.env.ADMIN_ORG_ID } })
        const stationData = []
        masterStations.map(({ name, latitude, longitude, radius, isActive }) => {
            stationData.push({ name, latitude, longitude, radius, isActive, organization_id })
        })
        await Station.bulkCreate(stationData)
    } catch (err) {
        console.log(err)
    }
}

const sendPdcReqMail = async (id) => {
    try {
        const pdcRequestData = await PdcRequests.findOne({
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'username'],
                },
            ],
            where: { id },
        })
        if (pdcRequestData && pdcRequestData.email) {
            // type 1 for project 0 for PDC
            if (pdcRequestData.type) {
                await Project.update({ isActive: 1, integrity_status: 1, integrity_checked_at: Date.now() }, { where: { id: pdcRequestData.record_id } })
                const projectData = await Project.findOne({
                    attributes: ['id', 'name', 'isDraft'],
                    where: { id: pdcRequestData.record_id },
                })
                pdcRequestData.name = projectData.name
                // creating the project in the side menu
                if (projectData.isDraft != 1) {
                    const folderData = await ProjectSidebarFolders.findOne({
                        where: {
                            user_id: pdcRequestData.user.id,
                            project_id: null,
                            parent: null,
                        },
                    })
                    await ProjectSidebarFolders.create({
                        project_id: projectData.id,
                        user_id: pdcRequestData.user.id,
                        name: projectData.name,
                        parent: folderData ? folderData.parent : null,
                    })
                }
                await sendPdcRequestEmail(pdcRequestData)
            } else {
                // Active PDC
                await ProjectPdcCategory.update(
                    { is_active: true },
                    {
                        where: {
                            id: pdcRequestData.record_id,
                        },
                    },
                )

                const pdcCategoryData = await ProjectPdcCategory.findOne({
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: PdcOrgApprovals,
                            attributes: [['org_id', 'id']],
                        },
                    ],
                    where: { id: pdcRequestData.record_id },
                })
                pdcRequestData.name = pdcCategoryData.name
                const pdcOrganizations = pdcCategoryData.pdc_org_approvals
                pdcOrganizations &&
                    pdcOrganizations.length > 0 &&
                    (await Promise.all(
                        pdcOrganizations.map(async ({ id }) => {
                            const userData = await Organization.findOne({
                                attributes: [],
                                include: [
                                    {
                                        model: User,
                                        attributes: ['id', 'email', 'username'],
                                        required: true,
                                        where: { role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER] },
                                    },
                                ],
                                where: { id },
                            })
                            if (userData.users[0].id != pdcRequestData.user_id) {
                                const { users } = userData
                                users.forEach(async (user) => {
                                    pdcRequestData.user = user
                                    await sendPdcRequestEmail(pdcRequestData)
                                })
                            }
                        }),
                    ))
            }
            await PdcRequests.destroy({ where: { id } })
        }
        if (pdcRequestData) await PdcRequests.destroy({ where: { id } })
    } catch (err) {
        console.log('sendPdcReqMail --> ', err)
    }
}

const fetchProjectEvents = async (items, orgName) => {
    try {
        const prevTime = new Date(new Date(new Date() - process.env.EVENT_DELAY_TIME * 60000).toISOString())

        const MProjectEvent = await mdb.project_event(orgName || process.env.HOST_ORG)
        const query = {
            isPublicEvent: { $in: [1, true] },
            item_id: { $in: items },
            createdAt: {
                $lt: new Date(prevTime),
            },
        }
        const projectEvent = await MProjectEvent.find(query)
        return projectEvent
    } catch (err) {
        console.log(err)
        return err
    }
}

const fetchTemperatureDetails = async (where) => {
    try {
        // Temperature logs
        const temperatureLogs = await TemperatureLog.findAll({
            attributes: ['temperature', 'createdAt'],
            where,
            order: [['id', 'ASC']],
        })

        return temperatureLogs
    } catch (err) {
        return err
    }
}

const fetchHumidityDetails = async (where) => {
    try {
        // Humidity logs
        const humidityLogs = await HumidityLog.findAll({
            attributes: ['humidity', 'createdAt'],
            where,
            order: [['id', 'ASC']],
        })

        return humidityLogs
    } catch (err) {
        return err
    }
}

const fetchSealingOpenCount = async (where) => {
    try {
        // Sealing count
        const sealingOpenCount = await SealingDetail.findOne({
            attributes: ['open_count'],
            where,
            order: [['id', 'DESC']],
        })

        return sealingOpenCount ? sealingOpenCount.open_count : 0
    } catch (err) {
        return err
    }
}

const fetchItemDetails = async (items) => {
    try {
        // Item details
        const item = await Item.findAll({
            attributes: ['id', 'itemID', 'qr_code', 'manual_code', 'is_available'],
            where: { id: { [Op.in]: items } },
        })

        return item
    } catch (err) {
        return err
    }
}

const checkManualCode = async (manual_code, qr_code) => {
    let itemWhere = { [Op.or]: [{ manual_code }, { qr_code: manual_code }] }
    let containerWhere = { [Op.or]: [{ manual_code }, { unique_code: manual_code }] }
    if (qr_code) {
        containerWhere = { [Op.or]: [{ manual_code }, { unique_code: qr_code }, { manual_code: qr_code }, { unique_code: manual_code }] }
        itemWhere = { [Op.or]: [{ manual_code }, { qr_code }, { manual_code: qr_code }, { qr_code: manual_code }] }
    }
    const existingInContainer = await Container.findOne({ logging: console.log, where: containerWhere })
    const existingInItem = await Item.findOne({ logging: console.log, where: itemWhere })

    return { existingInContainer, existingInItem }
}

const fetchDetailsByCode = async (actionType, items, orgName) => {
    try {
        const where = { item_id: { [Op.in]: items } }
        switch (actionType) {
            case 'project-event':
                const projectEvents = await fetchProjectEvents(items, orgName)
                return projectEvents

            case 'temperature':
                const temperatureDetails = await fetchTemperatureDetails(where)
                return temperatureDetails

            case 'humidity':
                const humidityDetails = await fetchHumidityDetails(where)
                return humidityDetails

            case 'sealingOpenCount':
                const sealingOpenCount = await fetchSealingOpenCount(where)
                return sealingOpenCount

            case 'itemDetails':
                const itemDetail = await fetchItemDetails(items)
                return itemDetail

            default:
                const itemDetails = await fetchItemDetails(items)
                return itemDetails
        }
    } catch (err) {
        console.log(err)
    }
}

exports.addProjectParticipants = addProjectParticipants
exports.removeProjectParticipants = removeProjectParticipants
exports.updateOrgCategoryProjects = updateOrgCategoryProjects
exports.addOrganizationStations = addOrganizationStations
exports.sendPdcReqMail = sendPdcReqMail
exports.checkManualCode = checkManualCode
exports.fetchDetailsByCode = fetchDetailsByCode
