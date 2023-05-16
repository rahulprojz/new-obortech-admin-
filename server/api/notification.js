const express = require('express')
const db = require('../models')
const mdb = require('../models/mangoose/index.model')
const logger = require('../logs')

const Project = db.projects

const User = db.users
const Item = db.items
const Organization = db.organizations
const ProjectUser = db.project_users
const ProjectParticipants = db.project_participants
const ProjectCategory = db.project_categories
const ProjectDocumentCategory = db.project_document_categories
const ProjectEventCategory = db.project_event_categories
const NotificationSetting = db.notification_settings
const Notification = db.notifications
const NotificationSettingDocument = db.notification_setting_documents
const NotificationSettingEvent = db.notification_setting_events
const NotificationSettingOrganization = db.notification_setting_organizations
const DocumentCategory = db.document_categories
const EventCategory = db.event_categories
const ProjectRoad = db.project_roads
const Station = db.stations
const { Op } = db.Sequelize
const router = express.Router()
const string = require('../helpers/LanguageHelper')
const { sendViewProfileEmail } = require('../helpers/email-helper')

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

/**
 * Fetch Project and its related details for Notification setting for logged in user
 */
router.get('/default-options', async (req, res) => {
    try {
        let projects = []
        projects = await ProjectUser.findAll({
            include: [
                {
                    attributes: ['id', 'name'],
                    model: Project,
                    include: [
                        {
                            attributes: ['id'],
                            model: ProjectCategory,
                            include: [
                                {
                                    attributes: ['id', 'project_category_id', 'document_category_id'],
                                    model: ProjectDocumentCategory,
                                    separate: true,
                                    include: [
                                        {
                                            attributes: ['id'],
                                            model: DocumentCategory,
                                        },
                                    ],
                                },
                                {
                                    attributes: ['id', 'project_category_id', 'event_category_id'],
                                    model: ProjectEventCategory,
                                    separate: true,
                                    include: [
                                        {
                                            attributes: ['id'],
                                            model: EventCategory,
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            model: ProjectParticipants,
                            separate: true,
                            attributes: ['id', 'participant_id'],
                            include: [
                                {
                                    model: Organization,
                                    attributes: ['id', 'name'],
                                    where: { isDeleted: 0 },
                                    require: true,
                                },
                            ],
                        },
                    ],
                    where: {
                        is_completed: 0,
                        isDraft: 0,
                    },
                },
            ],
            where: {
                user_id: req.user.id,
            },
        })

        res.json(projects)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Save Notification Settings
 */
router.post('/save', async (req, res) => {
    const { project_id, document_events, alert_events, organizations, document_comment, document_acceptance, document_submit, event_submit, event_comment, notify_email, status, event_acceptance, event_rejection, document_rejection } = req.body
    const user_id = req.session.passport.user
    try {
        NotificationSetting.findOne({
            where: {
                project_id,
                user_id,
            },
        }).then(async (setting) => {
            if (setting) {
                // record found
                // remove related data and then add again after updating master table
                await NotificationSettingEvent.destroy({
                    where: {
                        notification_settings_id: setting.id,
                    },
                })
                await NotificationSettingDocument.destroy({
                    where: {
                        notification_settings_id: setting.id,
                    },
                })
                await NotificationSettingOrganization.destroy({
                    where: {
                        notification_settings_id: setting.id,
                    },
                })
                NotificationSetting.update(
                    {
                        document_comment,
                        document_acceptance,
                        document_submit,
                        event_comment,
                        event_submit,
                        event_acceptance,
                        event_rejection,
                        document_rejection,
                        notify_email,
                        status,
                    },
                    {
                        where: {
                            id: setting.id,
                        },
                    },
                ).then(async () => {
                    if (!organizations.includes(req.user.organization_id)) {
                        organizations.push(req.user.organization_id)
                    }
                    organizations.map(async (org) => {
                        await NotificationSettingOrganization.create({
                            notification_settings_id: setting.id,
                            organization_id: org,
                        })
                    })
                    document_events.map(async (ev) => {
                        await NotificationSettingDocument.create({
                            notification_settings_id: setting.id,
                            document_event_id: ev,
                        })
                    })
                    alert_events.map(async (ev) => {
                        await NotificationSettingEvent.create({
                            notification_settings_id: setting.id,
                            alert_event_id: ev,
                        })
                    })
                })
            } else {
                // no record found
                NotificationSetting.create({
                    document_comment,
                    document_acceptance,
                    document_submit,
                    event_comment,
                    event_submit,
                    event_acceptance,
                    event_rejection,
                    document_rejection,
                    notify_email,
                    status,
                    project_id,
                    user_id,
                }).then(async (newSetting) => {
                    organizations.map(async (org) => {
                        await NotificationSettingOrganization.create({
                            notification_settings_id: newSetting.id,
                            organization_id: org,
                        })
                    })
                    document_events.map(async (ev) => {
                        await NotificationSettingDocument.create({
                            notification_settings_id: newSetting.id,
                            document_event_id: ev,
                        })
                    })
                    alert_events.map(async (ev) => {
                        await NotificationSettingEvent.create({
                            notification_settings_id: newSetting.id,
                            alert_event_id: ev,
                        })
                    })
                })
            }
        })
        res.json({ status: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Fetch Notifications
 */
router.post('/fetch-notifications', async (req, res) => {
    try {
        const { limit, offset } = req.body
        const user_id = req.user.id

        let allNotificaitons = []
        if (user_id) {
            const isNumbersOnly = /^\d+$/
            let notificaitons = await Notification.findAll({
                include: [
                    {
                        model: Project,
                        attributes: ['name', 'custom_labels', 'archived'],
                        required: false,
                        include: [
                            {
                                model: ProjectRoad,
                                include: [
                                    {
                                        model: Station,
                                        attributes: ['name'],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: User,
                        attributes: ['username', 'unique_id'],
                        require: true,
                        include: [
                            {
                                model: Organization,
                                attributes: ['id', 'name'],
                                where: { isDeleted: 0 },
                            },
                        ],
                        where: { isDeleted: 0 },
                    },
                    {
                        model: Item,
                        attributes: ['itemID'],
                    },
                ],
                where: {
                    user_id: parseInt(user_id),
                },
                order: [
                    ['id', 'DESC'],
                    [db.projects, db.project_roads, 'id', 'DESC'],
                ],
                limit,
                offset,
            })

            const ids = []
            const id = []
            notificaitons.map((notification) => {
                if (isNumbersOnly.test(notification.project_event_id)) {
                    id.push(parseInt(notification.project_event_id, 10))
                    return notification
                }
                if (notification.project_event_id) {
                    ids.push(notification.project_event_id)
                }
                return notification
            })
            const match = {
                $and: [
                    {
                        $or: [{ event_submission_id: { $in: ids } }, { id: { $in: id } }],
                    },
                ],
            }
            const $project = {
                _id: true,
                event_submission_id: true,
                id: true,
                event_id: true,
                event_name: true,
                local_event_name: true,
                container_id: true,
                itemName: true,
                stationName: true,
            }
            const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
            const projectEvents = await MProjectEvent.aggregate([{ $match: match }, { $project }]).exec()
            notificaitons = notificaitons.map((n) => {
                const event = projectEvents.find((pEvent) => pEvent.id === n.project_event_id || pEvent.event_submission_id === n.project_event_id) || {}
                n.setDataValue('project_event', event || {})
                return n
            })
            allNotificaitons = notificaitons
        }

        res.json(allNotificaitons)
    } catch (err) {
        logger.error('Error --> ', err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/notification-view-user', async (req, res) => {
    try {
        const { user_id } = req.body
        const sender_id = req.session.passport.user
        if (!user_id) {
            return res.status(400).json({ error: string.statusResponses.emptyData })
        }
        const alreadyExist = await Notification.findOne({
            where: { event_type: 'view_user', user_id: user_id, from: sender_id, isRead: 0 },
        })
        if (!alreadyExist) {
            const activeUser = await User.findOne({ where: { id: user_id, isDeleted: 0 } })
            const activeSender = await User.findOne({ where: { id: sender_id, isDeleted: 0 } })
            await sendViewProfileEmail(activeUser.email, activeUser.language, activeSender.username, activeUser.username)
            const response = await Notification.create({
                user_id,
                event_action: 'ALERT',
                event_type: 'view_user',
                from: sender_id,
                isRead: 0,
            })
            res.json(response)
        } else {
            res.json({ message: 'already exist' })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Read One Notification
 */
router.post('/read-notification', async (req, res) => {
    const { notification_id } = req.body
    try {
        await Notification.update({ isRead: 1 }, { where: { id: notification_id } })
        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Read All Notification
 */
router.post('/read-all-notifications', async (req, res) => {
    const { user_id } = req.body
    try {
        await Notification.update(
            {
                isRead: 1,
            },
            {
                where: {
                    user_id,
                },
            },
        )
        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Fetch Notification Settings
 */
router.post('/fetch', async (req, res) => {
    const { project_id, user_id } = req.body
    try {
        const response = {}
        const notificaitonSettings = await NotificationSetting.findOne({
            where: {
                project_id,
                user_id,
            },
        })
        if (notificaitonSettings) {
            response.settings = notificaitonSettings
            const documents = await NotificationSettingDocument.findAll({
                where: {
                    notification_settings_id: notificaitonSettings.id,
                },
            })
            if (documents) {
                response.notification_documents = documents
                const events = await NotificationSettingEvent.findAll({
                    where: {
                        notification_settings_id: notificaitonSettings.id,
                    },
                })
                if (events) {
                    response.notification_events = events
                    const orgs = await NotificationSettingOrganization.findAll({
                        where: {
                            notification_settings_id: notificaitonSettings.id,
                        },
                    })
                    if (orgs) {
                        response.orgs = orgs
                    }
                }
            }
        }
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Fetch Unread Notification Count
 */

router.post('/fetch-unread-count', async (req, res) => {
    try {
        // const { user_id } = req.body
        const user_id = req.user.id
        if (user_id) {
            const unreadNotificaitonsCount = await Notification.count({
                where: {
                    user_id: parseInt(user_id, 10),
                    isRead: 0,
                },
            })
            return res.json(unreadNotificaitonsCount)
        }
        res.json(0)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
