// Cron Helper
const moment = require('moment-timezone')
const db = require('../models')
const { prepareEmailBody } = require('../helpers/email-helper')
const projectEventHelper = require('../helpers/project-event-helper.js')
const { alertEventsArr } = require('../../utils/commonHelper')

const ProjectParticipant = db.project_participants
const ProjectEvent = db.project_events
const NotificationSetting = db.notification_settings
const NotificationSettingDocument = db.notification_setting_documents
const NotificationSettingEvent = db.notification_setting_events
const NotificationOrganizations = db.notification_setting_organizations
const Notification = db.notifications
const Organization = db.organizations
const Project = db.projects
const User = db.users
const Event = db.events
const Item = db.items
const emailSender = require('../services/sendMail')
const string = require('./LanguageHelper')
const { getLanguageJson, dynamicLanguageStringChange } = require('../utils/globalHelpers')

// EMAIL & OTHER CONFIGURATIONS
const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env
const { Op } = db.Sequelize

/*
    Notify User
    This function will take Project and Event related details and figure out which user should receive notification.
*/
// const notify = async (project_event_id, project_id, item_id, event_id, event_type, event_action, session_user, event_users = [], document_deadline = null, currentdatetime = null) => {
const notify = async ({ project_event_id, project_id, item_id, event_id, event_type, event_action, session_user, event_users = [], document_deadline = null, currentdatetime = null, event_name = '', local_event_name = '', itemName }) => {
    try {
        // get session user
        let user_name = ''
        let orgnization_name = ''
        let user_organization_id = ''
        const doc_deadline = document_deadline || ''
        const eventsaveddatetime = currentdatetime || ''

        const user = await User.findOne({
            attributes: ['id', 'organization_id', 'username', 'unique_id', 'role_id'],
            include: [
                {
                    model: Organization,
                    attributes: ['id', 'name', 'blockchain_name'],
                    where: { isDeleted: 0 },
                },
            ],
            where: {
                id: session_user || process.env.ADMIN_USER_ID,
                isDeleted: 0,
            },
        })

        if (user) {
            user_name = user.username
            orgnization_name = user.organization.name
            user_organization_id = user.organization.id
        }
        // find project participants
        const project_participants = await ProjectParticipant.findAll({
            include: [
                {
                    model: Organization,
                    where: {
                        isDeleted: 0,
                    },
                    attributes: ['id'],
                    include: [
                        {
                            model: User,
                            required: true,
                            attributes: ['id', 'role_id', 'email', 'language'],
                            where: {
                                isDeleted: 0,
                                role_id: { [Op.in]: [process.env.ROLE_ADMIN, process.env.ROLE_MANAGER, process.env.ROLE_CEO, process.env.ROLE_USER, process.env.ROLE_SENIOR_MANAGER] },
                            },
                        },
                    ],
                },
            ],
            where: { project_id },
        })

        if (project_participants) {
            const isNotAdminRole = user.role_id != process.env.ROLE_ADMIN
            const isManagerRole = user.role_id == process.env.ROLE_MANAGER
            const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })
            project_participants.map((participant) => {
                if (participant.organization && participant.organization.users && participant.organization.users.length) {
                    participant.organization.users.map(async (user) => {
                        let sendNotification = false
                        if (event_action == 'ALERT') {
                            sendNotification = true
                            if (isManagerRole && projectDetails ? projectDetails.user_id != user.id : isNotAdminRole) {
                                const req = { user: { organization: participant.organization } }
                                const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user.id, project_id)
                                if (userManualEvents.length) {
                                    const itemId = userManualEvents.map((event) => parseInt(event.item_id))
                                    sendNotification = itemId.includes(parseInt(item_id))
                                } else {
                                    sendNotification = false
                                }
                            }
                        } else if (event_users.length) {
                            sendNotification = event_users.includes(user.id)
                        }
                        if (sendNotification) {
                            await _checkUserSettings(user, project_id, project_event_id, item_id, event_id, event_type, event_action, session_user, user_name, orgnization_name, user_organization_id, doc_deadline, eventsaveddatetime, event_name, itemName)
                        }
                    })
                }
            })
        }
    } catch (err) {
        console.log(err)
    }
}

const _checkUserSettings = async (user, project_id, project_event_id, item_id, event_id, event_type, event_action, session_user, user_name, orgnization_name, user_organization_id, doc_deadline, eventsaveddatetime, event_name, itemName) => {
    try {
        let needsToSend = false
        let settingWhere = ''
        let sendEmail = true
        let sendNotification = false

        if (user.id != session_user) {
            const setting = await NotificationSetting.findOne({
                where: {
                    project_id,
                    user_id: user.id,
                },
            })

            if (event_action != 'ALERT') {
                // Check event_type and event_action for send accept all and reject all type notification
                if ((event_action == 'DOCUMENT_ALL_ACCEPT' || event_action == 'EVENT_ALL_ACCEPT') && event_type == 'allaccept') {
                    event_type = 'accept'
                    sendNotification = true
                } else if ((event_action == 'DOCUMENT_ALL_REJECT' || event_action == 'EVENT_ALL_REJECT') && event_type == 'allreject') {
                    event_type = 'reject'
                    sendNotification = true
                }
                if (setting) {
                    // Check if user want to recive email or not
                    sendEmail = setting.notify_email

                    // Check notification setting organizations
                    const noti_orgs = await NotificationOrganizations.findAll({
                        where: {
                            notification_settings_id: setting.id,
                            organization_id: user_organization_id,
                        },
                    })
                    if (noti_orgs.length > 0) {
                        // settings found, so check current scenario against saved settings
                        if (event_type == 'document' && event_action == 'SUBMIT' && setting.document_submit) {
                            emailSubject = string.notificatoinSubject.documentSubmitted
                            settingWhere = {
                                notification_settings_id: setting.id,
                                document_event_id: event_id,
                            }
                        } else if (event_type == 'event' && event_action == 'SUBMIT' && setting.event_submit) {
                            emailSubject = string.notificatoinSubject.eventSubmitted
                            settingWhere = {
                                notification_settings_id: setting.id,
                                alert_event_id: event_id,
                            }
                        } else if (event_type == 'document' && event_action == 'COMMENT' && setting.document_comment) {
                            emailSubject = string.notificatoinSubject.commented
                            settingWhere = {
                                notification_settings_id: setting.id,
                                document_event_id: event_id,
                            }
                        } else if (event_type == 'event' && event_action == 'COMMENT' && setting.event_comment) {
                            emailSubject = string.notificatoinSubject.commented
                            settingWhere = {
                                notification_settings_id: setting.id,
                                alert_event_id: event_id,
                            }
                        } else if (event_action == 'DOCUMENT_ACCEPT' && setting.document_acceptance) {
                            emailSubject = string.notificatoinSubject.documentAccepted
                            settingWhere = {
                                notification_settings_id: setting.id,
                                document_event_id: event_id,
                            }
                        } else if (event_action == 'DOCUMENT_REJECT' && setting.document_rejection) {
                            emailSubject = string.notificatoinSubject.documentRejected
                            settingWhere = {
                                notification_settings_id: setting.id,
                                document_event_id: event_id,
                            }
                        } else if (event_action == 'EVENT_ACCEPT' && setting.event_acceptance) {
                            emailSubject = string.notificatoinSubject.documentAccepted
                            settingWhere = {
                                notification_settings_id: setting.id,
                                alert_event_id: event_id,
                            }
                        } else if (event_action == 'EVENT_REJECT' && setting.event_rejection) {
                            emailSubject = string.notificatoinSubject.documentRejected
                            settingWhere = {
                                notification_settings_id: setting.id,
                                alert_event_id: event_id,
                            }
                        }

                        if (settingWhere) {
                            if (event_type == 'document') {
                                const result = await NotificationSettingDocument.findOne({
                                    where: settingWhere,
                                })
                                if (result) {
                                    needsToSend = true
                                }
                            } else {
                                const result = await NotificationSettingEvent.findOne({
                                    where: settingWhere,
                                })
                                if (result) {
                                    needsToSend = true
                                }
                            }
                        }
                        if (needsToSend) {
                            sendNotification = true
                        }
                    }
                } else {
                    sendNotification = true
                }
            } else if (alertEventsArr.includes(event_id)) {
                if (setting) {
                    if (event_id == process.env.tempAlertEventId) {
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                        event_type = 'temperature'
                    }
                    if (event_id == process.env.humidityAlertEventId) {
                        event_type = 'humidity'
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                    }
                    if (event_id == process.env.sealOpenAlertEventId) {
                        event_type = 'container'
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                    }
                    if (event_id == process.env.sealLockAlertEventId) {
                        event_type = 'containerlock'
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                    }
                    if (event_id == process.env.borderInEventId) {
                        event_type = 'borderin'
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                    }
                    if (event_id == process.env.borderOutEventid) {
                        event_type = 'borderout'
                        settingWhere = {
                            notification_settings_id: setting.id,
                            alert_event_id: event_id,
                        }
                    }
                    if (event_id == process.env.projectFinishedEventId) {
                        event_type = 'project'
                    }

                    // Check if user want to recive email or not
                    if (setting) {
                        sendEmail = setting.notify_email
                    }

                    if (settingWhere) {
                        const result = await NotificationSettingEvent.findOne({
                            where: settingWhere,
                        })
                        if (result) {
                            sendNotification = true
                        }
                    }
                } else {
                    if (event_id == process.env.tempAlertEventId) {
                        event_type = 'temperature'
                    }
                    if (event_id == process.env.humidityAlertEventId) {
                        event_type = 'humidity'
                    }
                    if (event_id == process.env.sealOpenAlertEventId) {
                        event_type = 'container'
                    }
                    if (event_id == process.env.sealLockAlertEventId) {
                        event_type = 'containerlock'
                    }
                    if (event_id == process.env.borderInEventId) {
                        event_type = 'borderin'
                    }
                    if (event_id == process.env.borderOutEventid) {
                        event_type = 'borderout'
                    }
                    if (event_id == process.env.projectFinishedEventId) {
                        event_type = 'project'
                    }
                    sendNotification = true
                }
            }

            if (setting && !setting.status) sendNotification = false

            if (sendNotification) {
                await _sendNotification(user, project_id, project_event_id, event_id, item_id, event_type, event_action, session_user, user_name, orgnization_name, sendEmail, doc_deadline, eventsaveddatetime, event_name, itemName)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

const _sendNotification = async (user, project_id, project_event_id, event_id, item_id, event_type, event_action, session_user, user_name, orgnization_name, sendEmail, doc_deadline, eventsaveddatetime, event_name, itemName) => {
    try {
        const notificationModel = await Notification.create({
            project_id,
            project_event_id,
            event_id,
            item_id,
            user_id: user.id,
            event_type,
            event_action,
            isRead: 0,
            from: session_user || process.env.ADMIN_USER_ID,
            createdAt: moment().utc(moment(eventsaveddatetime)).format('YYYY-MM-DD HH:mm:ss'),
        })
        if (notificationModel) {
            const notification = await Notification.findOne({
                include: [
                    {
                        model: Project,
                        attributes: ['name', 'custom_labels'],
                        required: true,
                    },
                    {
                        model: Event,
                        attributes: ['uniqId', 'eventName'],
                        required: true,
                    },
                ],
                where: {
                    id: notificationModel.id,
                },
            })

            // Send notification email if user opted
            if (notification && sendEmail) {
                notifyMail(user, event_name, notification.project || '', event_action, item_id, event_type, user_name, orgnization_name, doc_deadline, eventsaveddatetime, project_event_id, itemName)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

const notifyMail = async (user, event_name, project, event_action, item_id, event_type, user_name, orgnization_name, doc_deadline, eventsaveddatetime, project_event_id, itemName) => {
    try {
        // If user email not exists
        if (!user.email) return false

        // Email Subjects
        const languageJson = await getLanguageJson(user.language)
        const event_icon = `${(event_type === 'accept' || event_type == 'reject' ? 'ALERT' : event_action).toLowerCase()}_${event_type.toLowerCase()}`
        const { emailSubject, all_participants, all_participant_action, notification_type } = getEmailSubject(event_type, event_action, doc_deadline, languageJson)

        // Get item
        const itemModel = await Item.findByPk(item_id)
        if (itemModel) {
            const item = itemName
            const actionText = {
                COMMENT: languageJson.notificationPopup.actionText.COMMENT,
                SUBMIT: languageJson.notificationPopup.actionText.SUBMIT,
                DOCUMENT_ACCEPT: languageJson.notificationPopup.actionText.ACCEPTED,
                DOCUMENT_REJECT: languageJson.notificationPopup.actionText.REJECTED,
                EVENT_ACCEPT: languageJson.notificationPopup.actionText.ACCEPTED,
                EVENT_REJECT: languageJson.notificationPopup.actionText.REJECTED,
            }
            let templateName = 'user-notification-mail'
            if (notification_type == 'system') {
                templateName = 'system-notification-mail'
            }
            if (notification_type == 'accept') {
                templateName = 'accept-notification-mail'
            }
            if (notification_type == 'reject') {
                templateName = 'reject-notification-mail'
            }
            if (notification_type == 'doc_deadline') {
                templateName = 'user-notification-doc-mail'
            }

            let deadlinetext = ''
            let remainingtext = ''
            let actionVal = ''
            actionVal = actionText[event_action]
            if (notification_type == 'doc_deadline') {
                doc_deadline = moment(eventsaveddatetime).add(doc_deadline, 'hours').format('YYYY-MM-DD HH:mm:ss')
                if (doc_deadline) {
                    const doc_time = moment(doc_deadline).subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                    const hours = moment(doc_time).diff(moment(eventsaveddatetime), 'hours')
                    const minutes = moment(doc_time).diff(moment(eventsaveddatetime), 'minutes')
                    const total_diff_in_days = Math.floor(hours / 24)
                    const diff_in_hours = Math.floor(hours - total_diff_in_days * 24)
                    const diff_in_Mints = Math.floor(minutes - hours * 60)
                    expiredtext = `${total_diff_in_days > 0 ? `${total_diff_in_days}  ${string.emailmessages.days}` : ''} ${total_diff_in_days > 0 || diff_in_hours > 0 ? `${diff_in_hours}  ${string.emailmessages.hours}` : ''} ${total_diff_in_days == 0 ? `${diff_in_Mints} ${string.minutes}` : ''}`
                    remainingtext = languageJson.emailContent.remaining + expiredtext
                } else {
                    remainingtext = languageJson.emailContent.remaining + languageJson.emailContent.expiredtext
                }
                deadlinetext = languageJson.emailContent.deadlineAccept + moment(doc_deadline).format('dddd, MMMM Do YYYY, h:mm:ss a')
                actionVal = languageJson.emailContent.requestAccept
            }

            const replacements = {
                URL: SITE_URL,
                user_name,
                orgnization_name,
                action: actionVal,
                event_name,
                icon: event_icon,
                deadlinetext,
                remainingtext,
                project: project ? project.name : '',
                item,
                all_participants,
                all_participant_action,
                notiInfo: languageJson.emailContent.notiInfo,
                allRightsReserve: languageJson.emailContent.allRightsReserve,
                onItemIDTxt: dynamicLanguageStringChange(languageJson.notificationPopup.onItemIDTxt, project ? JSON.parse(project.custom_labels) : {}),
                projecttxt: languageJson.notificationPopup.projecttxt,
            }

            const htmlToSend = prepareEmailBody('notification', templateName, replacements)
            const message = {
                from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                to: user.email,
                subject: emailSubject,
                html: htmlToSend,
            }
            emailSender.sendMail(message, function (err, info) {
                if (err) {
                    console.log(err)
                }
            })
        }
    } catch (err) {
        console.log(err)
    }
}

const getEmailSubject = (event_type, event_action, doc_deadline, languageJson) => {
    let emailSubject = ''
    let all_participants = ''
    let all_participant_action = ''
    let notification_type = 'user'

    if (event_type == 'document' && event_action == 'SUBMIT' && doc_deadline != null) {
        emailSubject = languageJson.notificatoinSubject.documentSubmitted
        notification_type = 'doc_deadline'
    } else if (event_type == 'document' && event_action == 'SUBMIT') {
        emailSubject = languageJson.notificatoinSubject.documentSubmitted
    } else if (event_type == 'event' && event_action == 'SUBMIT') {
        emailSubject = languageJson.notificatoinSubject.eventSubmitted
        notification_type = 'doc_deadline'
    } else if (event_type == 'document' && event_action == 'COMMENT') {
        emailSubject = languageJson.notificatoinSubject.commented
    } else if (event_type == 'event' && event_action == 'COMMENT') {
        emailSubject = languageJson.notificatoinSubject.commented
    } else if (event_action == 'DOCUMENT_ACCEPT' || event_action == 'EVENT_ACCEPT') {
        emailSubject = languageJson.notificatoinSubject.documentAccepted
    } else if (event_action == 'DOCUMENT_REJECT' || event_action == 'EVENT_REJECT') {
        emailSubject = languageJson.notificatoinSubject.documentRejected
    } else if (event_type == 'temperature') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.temperatureBreached
    } else if (event_type == 'humidity') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.humidityBreached
    } else if (event_type == 'container') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.containerOpened
    } else if (event_type == 'containerlock') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.containerClosed
    } else if (event_type == 'borderin') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.borderin
    } else if (event_type == 'borderout') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.borderout
    } else if (event_type == 'project') {
        notification_type = 'system'
        emailSubject = languageJson.notificatoinSubject.projectFinished
    } else if (event_type == 'accept') {
        notification_type = 'accept'
        all_participants = languageJson.participant.allParticipant
        all_participant_action = 'accepted'
        emailSubject = languageJson.notificatoinSubject.allAccepted
    } else if (event_type == 'reject') {
        notification_type = 'reject'
        all_participants = languageJson.participant.allParticipant
        all_participant_action = 'rejected'
        emailSubject = languageJson.notificatoinSubject.allRejected
    }

    return {
        notification_type,
        all_participants,
        all_participant_action,
        emailSubject,
    }
}

exports.notify = notify
