// Load dependencies
const express = require('express')
const multipart = require('connect-multiparty')
const _ = require('lodash')
const moment = require('moment-timezone')
const ObjectId = require('mongodb').ObjectID
const string = require('../helpers/LanguageHelper')
// Load MySQL Models
const db = require('../models')
const mdb = require('../models/mangoose/index.model')
const networkHelper = require('../helpers/network-helper.js')
const projectEventHelper = require('../helpers/project-event-helper.js')
const projectHelper = require('../helpers/project-helper.js')
const notificationHelper = require('../helpers/notification-helper.js')
const networkHooks = require('../hooks/network-hooks')
const { hostAuth, userAuth, jwtAuth } = require('../middlewares')
const { getProjectByName, getGrouptByName, getItemByName, getDeviceByName, getTruckByName, getContainerByName } = require('../utils/projectEventHelpers/project-event-helper')
const s3Helper = require('../helpers/s3-helper')
const ProjectEvent = db.project_events
const ProjectEventUser = db.project_event_users
const User = db.users
const Project = db.projects
const Organizations = db.organizations
const ProjectComment = db.project_event_comments
const ProjectCommentStatus = db.project_comment_status
const ProjectPdcCategoryEvents = db.project_pdc_category_events
const EventAcceptDocumentUser = db.event_accept_document_users
const ProjectPdcCategory = db.project_pdc_categories
const ProjectSubEvents = db.project_sub_events
const DocumentAcceptedUser = db.document_accepted_users
const DocumentSeenUser = db.document_seen_users
const UserHiddenEvent = db.user_hidden_events
const ProjectEventImage = db.project_event_image
const Event = db.events
const Truck = db.trucks
const Container = db.containers
const Item = db.items
const Device = db.devices
const Station = db.stations
const ProjectCategory = db.project_categories
const PdcOrganization = db.pdc_organizations
const PdcOrgs = db.pdc_orgs
const PdcParticipants = db.pdc_participants
const ApprovedBy = db.approved_by
const OrganizationType = db.organization_type
const TempNetworkEvent = db.temp_network_events
const Group = db.groups
const UserType = db.user_types
const UserTitle = db.user_titles
const EventDocumentUser = db.event_document_users
const FormAnswers = db.form_answers

const { Op } = db.Sequelize
// Define global variables
const router = express.Router()
const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })

router.use(hostAuth)

//Fetch API wrapper
router.post('/fetch/:data_type', [jwtAuth, userAuth], async (req, res) => {
    req.body['orgName'] = req.user.username
    req.body['userName'] = req.user.unique_id
    const project_name = req.body.project_name
    const group_name = req.body.group_name || null
    const truck_name = req.body.truck_name || null
    const container_name = req.body.container_name || null
    const item_name = req.body.item_name || null
    const device_name = req.body.device_name || null
    const data_type = req.params.data_type || null

    try {
        //Get project data by project name
        const projectData = await getProjectByName(project_name)

        const user_id = req.user.id
        const user_role_id = req.user.role_id
        const organization_id = req.user.organization_id
        const created_by = 0
        const project_id = projectData.id
        const eventId = 0
        const orgName = networkHooks.sanitize(req.user.organization.name)
        const userName = req.user.unique_id

        const eventsBody = {
            user_id: user_id,
            user_role_id: user_role_id,
            organization_id: organization_id,
            created_by: created_by,
            project_id: project_id,
            eventId: eventId,
            orgName: orgName,
            userName: userName,
        }

        let groupData
        let truckData
        let containerData
        let itemData
        let deviceData
        let response

        //Get group data by group name
        if (group_name) {
            groupData = await getGrouptByName(group_name)
            eventsBody.group_id = groupData.id
        }
        if (truck_name) {
            truckData = await getTruckByName(truck_name)
            eventsBody.truck_id = truckData.id
        }
        if (container_name) {
            containerData = await getContainerByName(container_name)
            eventsBody.container_id = containerData.id
        }

        //Get item data by item name
        if (item_name) {
            itemData = await getItemByName(item_name)
            eventsBody.item_id = itemData.id
        }

        //Get device data by device name
        if (device_name) {
            deviceData = await getDeviceByName(device_name)
        }

        switch (data_type) {
            case 'events':
                //call project events API with filters
                response = await networkHooks.callInternalApi('project-event/fetch', 'POST', eventsBody)
                break

            case 'stations':
                break

            case 'temperature':
                //call project logs API with filters
                const temperatureLogsQuery = {
                    project_id: project_id,
                    device_id: deviceData.id,
                    item_id: itemData.id,
                    orgName: orgName,
                    userName: userName,
                }
                response = await networkHooks.callInternalApi('project-logs/temperature', 'GET', temperatureLogsQuery)
                break

            case 'humidity':
                //call project logs API with filters
                const humidityLogsQuery = {
                    project_id: project_id,
                    device_id: deviceData.id,
                    item_id: itemData.id,
                    orgName: orgName,
                    userName: userName,
                }
                response = await networkHooks.callInternalApi('project-logs/humidity', 'GET', humidityLogsQuery)
                break

            case 'location':
                //call project logs API with filters
                const locationLogsQuery = {
                    project_id: project_id,
                    item_id: itemData.id,
                    orgName: orgName,
                    userName: userName,
                }
                response = await networkHooks.callInternalApi('project-logs/location', 'GET', locationLogsQuery)
                break

            default:
                break
        }
        res.json({ response })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

const NOTIFICATION_ACCEPT_ALL = {
    document: 'DOCUMENT_ALL_ACCEPT',
    event: 'EVENT_ALL_ACCEPT',
}

const NOTIFICATION_ACCEPT = {
    document: 'DOCUMENT_ACCEPT',
    event: 'EVENT_ACCEPT',
}

const NOTIFICATION_REJECT_ALL = {
    document: 'DOCUMENT_ALL_REJECT',
    event: 'EVENT_ALL_REJECT',
}

const NOTIFICATION_REJECT = {
    document: 'DOCUMENT_REJECT',
    event: 'EVENT_REJECT',
}

// Fetch Project Events
router.post('/fetch', [jwtAuth, userAuth], async (req, res) => {
    req.body['user_id'] = req.user.id
    req.body['user_role_id'] = req.user.role_id
    // req.body['created_by'] = req.user.id
    // req.body['organization_id'] = req.user.organization_id
    const { user_id } = req.body
    const { user_role_id } = req.body
    const { organization_id } = req.body
    const { created_by } = req.body
    const { project_id } = req.body
    const start_date_time = req.body.start_date_time || null
    const end_date_time = req.body.end_date_time || null
    const group_id = req.body.group_id || null
    const { eventId } = req.body
    const truck_id = req.body.truck_id || null
    const container_id = req.body.container_id || null
    const item_id = req.body.item_id || null
    const search_text = req.body.search_text || null
    const event_name = req.body.eventName || null
    const pdc_name = req.body.pdc_name || null
    const searchEventId = req.body.searchEventId || null
    const isAddedInBlockchain = req.body.isAddedInBlockchain || null
    let filteredEvents = []
    const mongooseQuery = {}
    const query = []
    const $match = {
        is_child_event: { $in: [null, false] },
    }
    const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
    const isNotAdminRole = user_role_id != process.env.ROLE_ADMIN
    const isNotPublicUserRole = user_role_id != process.env.ROLE_PUBLIC_USER
    const isManagerRole = user_role_id == process.env.ROLE_MANAGER

    // Filter by projects
    if (Array.isArray(project_id) && project_id.length > 0) {
        $match.project_id = { $in: project_id }
    } else if (project_id) {
        $match.project_id = project_id
    }

    if (group_id) {
        $match.group_id = group_id
    }
    if (truck_id) {
        $match.truck_id = truck_id
    }
    if (container_id) {
        $match.container_id = container_id
    }
    if (item_id) {
        $match.item_id = item_id
    }
    if (eventId) {
        $match.event_id = eventId
    }
    if (event_name) {
        $match.event_name = event_name
    }
    if (pdc_name) {
        $match.pdc_name = pdc_name
    }
    mongooseQuery.viewUsers = { $elemMatch: {} }

    $match['viewUsers.user_id'] = user_id

    // Filter by created by user
    if (created_by) {
        $match['viewUsers.created_by'] = created_by
    }

    if (req.body.lastEventId) {
        $match._id = { $gte: new ObjectId(req.body.lastEventId) }
    }

    if (req.body.createdAt && start_date_time != null && end_date_time != null) {
        const endTime = moment(end_date_time)
        const startTime = moment(start_date_time)
        const diffEnd = moment(req.body.createdAt).diff(endTime, 'seconds')
        const diffStart = moment(req.body.createdAt).diff(startTime, 'seconds')
        if (diffEnd > 0 && diffStart < 0) {
            $match.createdAt = { $lte: new Date(req.body.createdAt), $gte: new Date(start_date_time) }
        } else {
            $match.createdAt = { $lte: new Date(end_date_time), $gte: new Date(start_date_time) }
        }
    }
    if (!req.body.createdAt && start_date_time != null && end_date_time != null) {
        $match.createdAt = { $lte: new Date(end_date_time), $gte: new Date(start_date_time) }
    }

    if (req.body.viewed != undefined) {
        $match['viewUsers.viewed'] = req.body.viewed
    }

    try {
        // Filter by organization
        if (organization_id) {
            const organizationModel = await Organizations.findOne({
                attributes: ['id'],
                include: [
                    {
                        attributes: ['id'],
                        model: User,
                    },
                ],
                where: {
                    id: organization_id,
                },
            })
            const allUsers = organizationModel.users.map((user) => user.id)
            if (allUsers && !created_by) {
                $match['viewUsers.created_by'] = { $in: allUsers }
            }
        }

        // Search/Filter event by search text
        if (search_text) {
            if (isAddedInBlockchain) {
                $match.isAddedInBlockchain = 1
            }
            $match.$and = [
                {
                    $or: [
                        { event_name: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { itemName: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { groupName: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { truckName: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { containerName: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { deviceName: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { deviceTag: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { event_id: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { location: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { description: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { title: { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { 'comments.comment': { $regex: '.*' + search_text + '.*', $options: 'i' } },
                        { 'projectEventAnswer.answers': { $regex: '.*' + search_text + '.*', $options: 'i' } },
                    ],
                },
            ]
        }
        await MProjectEvent.updateMany({ viewUsers: { $elemMatch: { user_id, viewed: 0 } }, project_id }, { $set: { 'viewUsers.$.viewed': true } })

        const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })

        if (isManagerRole && projectDetails ? projectDetails.user_id != user_id : isNotAdminRole && isNotPublicUserRole) {
            const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, project_id)
            if (userManualEvents.length || req.body.lastEventId) {
                if (userManualEvents.length) {
                    const oid = new ObjectId(userManualEvents[0]._id)
                    $match._id = { $gte: oid }
                    if (search_text) {
                        $match.$and.push({ _id: { $gte: oid } })
                    }
                    if (!item_id) {
                        $match.item_id = { $in: userManualEvents.map((event) => parseInt(event.item_id)) }
                    }
                }
                const aQuery =
                    parseInt(req.body.offset) >= 0 && parseInt(req.body.limit) >= 0 ? [{ $match }, { $sort: { createdAt: -1 } }, { $skip: req.body.offset }, { $limit: req.body.limit }, { $project: { image_base: 0 } }] : [{ $match }, { $sort: { createdAt: -1 } }, { $project: { image_base: 0 } }]
                // console.log(aQuery)
                let document = await MProjectEvent.aggregate(aQuery).exec()

                document = await projectEventHelper.eventAcceptAndReject(document)

                const user_ids = document.map((doc) => doc.viewUsers.map((users) => users.user_id))
                const ids = _.uniq([].concat.apply([], user_ids))
                const eventUsers = await projectEventHelper.fetchProjectEventUsers(ids)
                const projectEvents = await projectEventHelper.fetchEventComments(document)
                return res.json({ projectEvents, eventUsers, userManualEvents })
            }

            return res.json({ projectEvents: [], eventUsers: [], userManualEvents: [] })
        }
        const aQuery = parseInt(req.body.offset) >= 0 && parseInt(req.body.limit) >= 0 ? [{ $match }, { $sort: { createdAt: -1 } }, { $skip: req.body.offset }, { $limit: req.body.limit }, { $project: { image_base: 0 } }] : [{ $match }, { $sort: { createdAt: -1 } }, { $project: { image_base: 0 } }]
        // console.log(JSON.stringify(aQuery))
        let document = await MProjectEvent.aggregate(aQuery)
        const ids = _.uniq(
            [].concat.apply(
                [],
                document.map((doc) => doc.viewUsers.map((users) => users.user_id)),
            ),
        )
        document = await projectEventHelper.eventAcceptAndReject(document)
        const eventUsers = await projectEventHelper.fetchProjectEventUsers(ids)
        const projectEvents = await projectEventHelper.fetchEventComments(document)

        res.json({ projectEvents, eventUsers })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

//fetch-accept-user-list
router.post('/fetch-accept-user-list', async (req, res) => {
    try {
        const { project_event_id } = req.body
        const acceptEventUser = await EventAcceptDocumentUser.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'local_first_name', 'local_last_name', 'username'],
                },
                {
                    model: Organizations,
                    attributes: ['id', 'local_name', 'name', 'organization_type_id'],
                },
            ],
            where: { project_event_id },
        })
        res.json(acceptEventUser)
    } catch (err) {
        console.log(err)
    }
})

// Add Project Event
router.post('/', [jwtAuth, userAuth], multipartMiddleware, async (req, res) => {
    try {
        const response = await projectEventHelper._addProjectEvent(req)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Project Event
router.post('/add', [jwtAuth, userAuth], multipartMiddleware, async (req, res) => {
    try {
        const filedata = req.files.file
        const itemIds = req.body.itemIds ? JSON.parse(req.body.itemIds) : []
        const { project_id, event_id, pdcName, title, document_deadline } = req.body
        const pEventType = await projectEventHelper.getEventType(event_id)
        const eventListData = await projectEventHelper.getEventList(project_id)
        const acceptUserArr = req.body.accept_users ? req.body.accept_users.split(',') : ['']
        const eventUserArr = req.body.event_users ? req.body.event_users.split(',') : ['']
        const eventData = eventListData[pEventType.eventType == 'event' ? 'eventList' : 'documentList'].map((val) => {
            return val.uniqId
        })
        if (eventData.indexOf(event_id) == -1) {
            return res.json({ success: false, error: string.eventNotPresent })
        }
        if (title.length > 50) {
            return res.json({ success: false, error: string.titleMaxLimit })
        }
        if (document_deadline == '') {
            return res.json({ success: false, error: `${string.emailmessages.acceptancedate} ${string.errors.required}` })
        }
        if (parseInt(document_deadline) <= 0) {
            return res.json({ success: false, error: string.acceptancedeadlinereq })
        }
        if (!itemIds.length) {
            return res.json({ success: false, error: string.pleaseEnterAnyItem })
        }
        if (pEventType.eventType == 'document' && (filedata ? filedata.size == 0 : true)) {
            return res.json({ success: false, error: string.pleaseAttatchDocument })
        }
        if (!pdcName && pEventType.eventType == 'document' && !acceptUserArr[0]) {
            return res.json({ success: false, error: string.pleaseEnterAcceptUsers })
        }
        const uniqId = Math.random().toString(36).substr(2, 9)
        req.body['event_submission_id'] = uniqId.toLowerCase().toString()
        req.body['is_viewed'] = 0
        req.body['isPublicEvent'] = false
        req.body['pdcName'] = pdcName && pdcName.toLowerCase()
        req.body['type'] = pEventType.eventType
        req.body['event_name'] = pEventType.eventName
        req.body['local_event_name'] = pEventType.mongolianName

        if (filedata && filedata.size > 0 && req.body.type == 'event') {
            if (filedata.type != 'image/png' || filedata.type != 'image/jpg' || filedata.type != 'image/jpeg' || filedata.size > 3 * 1024 * 1024) {
                const responseData = await projectEventHelper.saveAPIEventImage(req)
                req.body['image_base'] = req.files.file.headers['content-type'] + ';base64,' + responseData.base64
            } else {
                res.json({ success: false, message: 'Invalid file! Supported file format: JPEG, JPG, PNG. Max file size: 3MB' })
            }
        } else if (filedata && req.body.type == 'document') {
            const responseData = await projectEventHelper.addDocumentAPI(req)
            req.body['image_base'] = responseData.base64
        }

        if (itemIds.length > 0) {
            const itemIdDetails = await projectEventHelper.mapItemIds(itemIds)
            req.body.itemIds = itemIdDetails
        }

        if (pdcName) {
            const pdcDetails = await projectEventHelper.getPDCDetails(event_id, pdcName)
            if (pdcDetails && pdcDetails.pdc_organizations.length > 0) {
                // Check if current user is allowed to submit an event
                if (!pdcDetails.pdc_organizations.some((orgUsers) => orgUsers.submit_user_id == req.user.id)) {
                    return res.json({ success: false, error: 'The current user is not allowed to submit an event' })
                }
                const acceptUsers = []
                const eventUsers = []
                if (!!acceptUserArr[0]) {
                    const allAcceptUsers = await projectEventHelper.appendStringEventAndAcceptUsers(req.body.accept_users)
                    const acceptUser = JSON.parse(allAcceptUsers)
                    acceptUser.map((userOrgs) => acceptUsers.push(userOrgs.split('-').map(Number)[0]))
                }
                if (!!eventUserArr[0]) {
                    const allEventUsers = await projectEventHelper.appendStringEventAndAcceptUsers(req.body.event_users)
                    const eventUser = JSON.parse(allEventUsers)
                    eventUser.map((userOrgs) => eventUsers.push(userOrgs.split('-').map(Number)[0]))
                }
                pdcDetails.pdc_organizations.map((orgUsers) => {
                    if (orgUsers.accept_user_id) acceptUsers.push(orgUsers.accept_user_id)
                    if (orgUsers.see_user_id) eventUsers.push(orgUsers.see_user_id)
                })
                const allAcceptUsers = await projectEventHelper.mapEventAndAcceptUsers(acceptUsers)
                req.body.accept_users = allAcceptUsers
                const allEventUsers = await projectEventHelper.mapEventAndAcceptUsers(eventUsers)
                req.body.event_users = allEventUsers
            } else {
                return res.json({ success: false, error: 'Invalid PDC Name or Event ID' })
            }
        }
        if (!pdcName) {
            if (!!acceptUserArr[0]) {
                const allAcceptUsers = await projectEventHelper.appendStringEventAndAcceptUsers(req.body.accept_users)
                req.body.accept_users = allAcceptUsers
            }
            if (!!eventUserArr[0]) {
                const allEventUsers = await projectEventHelper.appendStringEventAndAcceptUsers(req.body.event_users)
                req.body.event_users = allEventUsers
            }
        }

        req.body['user_id'] = req.user.id
        req.body['organization_id'] = req.user.organization_id
        req.body['user_role'] = req.user.role_id
        const response = await projectEventHelper._addProjectEvent(req)
        res.json(response)
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

// Add Comment on project events
router.post('/:id/comment', [jwtAuth, userAuth], async (req, res) => {
    try {
        const event_submission_id = req.params['id']
        req.body['organization_id'] = req.user.organization_id
        req.body['user_id'] = req.user.id
        const { comment, user_id, organization_id, type } = req.body
        if (!comment) {
            return res.json({ success: false, error: string.errors.enterComment })
        }
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const is_viewed = 0
        const eventType = await projectEventHelper.getSubmissionEventType(event_submission_id)
        req.body['type'] = eventType
        const projectcomment = await ProjectComment.create({
            event_submission_id,
            comment,
            user_id,
            is_viewed,
        })

        // Update status for all other users whose project id is same
        await ProjectCommentStatus.update(
            { is_viewed },
            {
                where: {
                    event_submission_id,
                    user_id: { [Op.ne]: user_id },
                },
            },
        )

        if (projectcomment) {
            const user = await User.findOne({ attributes: ['username'], where: { id: user_id, isDeleted: 0 } })
            projectcomment.setDataValue('username', user.username || '')
            const organization = await Organizations.findByPk(organization_id)
            projectcomment.setDataValue('organization_name', organization.name || '')

            const projectEvent = await MProjectEvent.findOne({ event_submission_id }, { _id: 1, viewUsers: 1, project_id: 1, event_id: 1, item_id: 1, event_name: 1, local_event_name: 1, event_submission_id: 1, itemName: 1 }).exec()
            if (projectEvent) {
                const event_type = type
                const projectEventUsers = []
                const projectEventOrgs = projectEvent.viewUsers

                // Add comment status for all users
                await projectEventHelper.addprojectcommentstatus(projectEvent, projectcomment.id, user_id)

                if (projectEventOrgs.length) {
                    projectEventOrgs.map((event) => {
                        projectEventUsers.push(event.user_id)
                    })
                }
                if (event_type) {
                    const { event_submission_id, project_id, event_id, event_name, local_event_name, item_id, itemName } = projectEvent
                    await notificationHelper.notify({ project_event_id: event_submission_id, project_id, item_id, event_id, event_type, event_action: 'COMMENT', session_user: req.user.id, event_users: projectEventUsers, event_name, local_event_name, itemName })
                }
            }
            res.json(projectcomment)
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Accept/Reject project event
router.patch('/:id', [jwtAuth, userAuth], async (req, res) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const project_event_id = req.params['id']
        const user_action = req.query['action']
        req.body['user_id'] = req.user.id
        req.body['organization_id'] = req.user.organization_id
        const eventType = await projectEventHelper.getSubmissionEventType(project_event_id)
        req.body['type'] = eventType.eventDataType
        req.body['item_id'] = eventType.itemId
        const { user_id, organization_id, item_id, type } = req.body
        const checkAcceptance = await DocumentAcceptedUser.findOne({ where: { project_event_id: project_event_id, user_id: req.user.id } })
        if (checkAcceptance) {
            return res.json({ message: string.event.eventAction })
        }
        const documentaccepteduser = await DocumentAcceptedUser.create({
            user_id,
            project_event_id,
            organization_id,
            is_rejected: user_action == 'reject' ? 1 : 0,
        })
        if (documentaccepteduser) {
            const projectEvent = await MProjectEvent.findOne({ event_submission_id: project_event_id })
            if (projectEvent) {
                const { project_id, event_submission_id, event_id, event_name, local_event_name, viewUsers, acceptUsers, attachment, file_hash, pdc_id, isAssetEvent, projectEventAnswer, itemName } = projectEvent
                const documentacceptedusers = await DocumentAcceptedUser.findAll({
                    where: {
                        project_event_id: event_submission_id,
                    },
                })
                const eventDocumentAccpetedUsers = await EventAcceptDocumentUser.findAll({
                    where: {
                        project_event_id: event_submission_id,
                    },
                })
                const projectEventUsers = []
                const projectOrgNameArr = []
                const organization_ids = viewUsers.map((user) => user.organization_id)
                const organizations = await Organizations.findAll({
                    attributes: ['name', 'id'],
                    where: {
                        id: { [Op.in]: organization_ids },
                    },
                })

                if (viewUsers) {
                    viewUsers.map((event) => {
                        projectEventUsers.push(event.user_id)
                        const org = organizations.find((org) => org.id == event.organization_id)
                        projectOrgNameArr.push(org.name.toLowerCase())
                    })
                }

                let flag = ''
                const checkisrejectedexists = documentacceptedusers.filter((event) => event.is_rejected == '1')
                const createdByUser = viewUsers.find((user) => viewUsers[0].created_by == user.user_id)
                const formBuilderData = projectEventAnswer.length !== 0 && projectEventAnswer[0].answers ? JSON.parse(`${projectEventAnswer[0].answers}`) : []
                projectEvent.supplier = createdByUser
                projectEvent.receiver = acceptUsers.length ? acceptUsers[0] : []

                // If user accepted the document
                if (user_action == 'accept') {
                    // Accept for one accept user
                    if (eventDocumentAccpetedUsers.length == 1 && isAssetEvent) {
                        await projectEventHelper.addProjectEventAssets(formBuilderData, projectEvent)
                    }
                    if (eventDocumentAccpetedUsers.length == 1 && (projectEvent.isIotEventOn || projectEvent.isIotEventOff)) {
                        await projectEventHelper.onIotonandOff(formBuilderData, projectEvent)
                    }

                    // All accepted
                    if (documentacceptedusers.length > 1 && documentacceptedusers.length === eventDocumentAccpetedUsers.length && checkisrejectedexists.length == 0) {
                        flag = 'all_accepted'
                        if (isAssetEvent) {
                            await projectEventHelper.addProjectEventAssets(formBuilderData, projectEvent)
                        }
                        if (projectEvent.isIotEventOn || projectEvent.isIotEventOff) {
                            await projectEventHelper.onIotonandOff(formBuilderData, projectEvent)
                        }
                        await notificationHelper.notify({ project_event_id: event_submission_id, project_id, item_id, event_id, event_type: 'allaccept', event_action: NOTIFICATION_ACCEPT_ALL[type], session_user: 0, event_users: projectEventUsers, event_name, local_event_name, itemName })
                    } else {
                        flag = 'accepted'
                        await notificationHelper.notify({
                            project_event_id: event_submission_id,
                            project_id,
                            item_id,
                            event_id,
                            event_type: type == 'document' ? 'document' : 'event',
                            event_action: NOTIFICATION_ACCEPT[type],
                            session_user: req.user.id,
                            event_users: projectEventUsers,
                            event_name,
                            local_event_name,
                            itemName,
                        })
                    }
                }

                // If user rejected the document
                if (user_action == 'reject') {
                    // Restore the asset quantity when reject the event
                    if (isAssetEvent && checkisrejectedexists.length == 1) {
                        if (formBuilderData.length > 0) {
                            await projectEventHelper.checkAndUpdateAsset(formBuilderData, createdByUser.organization_id, 'add')
                        }
                    }
                    // All rejected
                    if (documentacceptedusers.length > 1 && documentacceptedusers.length === eventDocumentAccpetedUsers.length && documentacceptedusers.length == checkisrejectedexists.length) {
                        flag = 'all_rejected'
                        await notificationHelper.notify({ project_event_id: event_submission_id, project_id, item_id, event_id, event_type: 'allreject', event_action: NOTIFICATION_REJECT_ALL[type], session_user: 0, event_users: projectEventUsers, event_name, local_event_name, itemName })
                    } else {
                        flag = 'rejected'
                        await notificationHelper.notify({
                            project_event_id: event_submission_id,
                            project_id,
                            item_id,
                            event_id,
                            event_type: type == 'document' ? 'document' : 'event',
                            event_action: NOTIFICATION_REJECT[type],
                            session_user: req.user.id,
                            event_users: projectEventUsers,
                            event_name,
                            local_event_name,
                            itemName,
                        })
                    }
                }

                // Add document accept event to network
                if (process.env.dev != 'true') {
                    //await networkHelper.addEventSubmission(projectEvent.event_id, req.user.id, projectEvent.project_id, item_id, project_event_id, type, projectEvent.attachment, projectEvent.file_hash, 1, null, projectOrgNameArr, 0, flag, projectEvent.pdc_id)
                }
            }
            res.json(documentaccepteduser)
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
    // try {
    //     const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)

    //     const project_event_id = req.params.id
    //     const user_action = req.query.action
    //     const { user_id, organization_id, item_id, type } = req.body

    //     const projectEvent = await MProjectEvent.findById(project_event_id, '')

    //     projectEvent.acceptUsers = projectEvent.acceptUsers.map((user) => {
    //         if (user.user_id == user_id) {
    //             user.accepted = user_action == 'accept'
    //             user.rejected = user_action == 'reject'
    //         }
    //         return user
    //     })
    //     await projectEvent.save()

    //     const allAcceptRejected = projectEvent.acceptUsers.every((e) => !!e.accepted || !!e.rejected)
    //     const projectEventUsers = []
    //     const projectOrgNameArr = []
    //     const organization_ids = projectEvent.viewUsers.map((user) => user.organization_id)
    //     const organizations = await Organizations.findAll({
    //         attributes: ['name', 'id'],
    //         where: {
    //             id: { [Op.in]: organization_ids },
    //         },
    //     })

    //     if (projectEvent.viewUsers) {
    //         projectEvent.viewUsers.map((event) => {
    //             projectEventUsers.push(event.user_id)
    //             const org = organizations.find((org) => org.id == event.organization_id)
    //             projectOrgNameArr.push(org.name.toLowerCase())
    //         })
    //     }

    //     let flag = ''
    //     const checkisallrejectedexists = projectEvent.acceptUsers.every((e) => e.rejected)
    //     const checkisrejectedexists = projectEvent.acceptUsers.some((e) => e.rejected)

    //     const { project_id, event_id, event_name, local_event_name } = projectEvent

    //     // If user accepted the document
    //     if (user_action == 'accept') {
    //         // All accepted
    //         if (allAcceptRejected && !checkisrejectedexists) {
    //             flag = 'all_accepted'
    //             // type == 'document' ? 'DOCUMENT_ALL_ACCEPT' : 'EVENT_ALL_ACCEPT',
    //             await notificationHelper.notify({ project_event_id, project_id, item_id, event_id, event_type: 'allaccept', event_action: NOTIFICATION_ACCEPT_ALL[type], session_user: 0, event_users: projectEventUsers, event_name, local_event_name })
    //         } else {
    //             flag = 'accepted'
    //             // type == 'document' ? 'DOCUMENT_ACCEPT' : 'EVENT_ACCEPT'
    //             await notificationHelper.notify({ project_event_id, project_id, item_id, event_id, event_type: type == 'document' ? 'document' : 'event', event_action: NOTIFICATION_ACCEPT[type], session_user: req.user.id, event_users: projectEventUsers, event_name, local_event_name })
    //         }
    //     }

    //     // If user rejected the document
    //     if (user_action == 'reject') {
    //         // All rejected
    //         if (allAcceptRejected && checkisallrejectedexists) {
    //             flag = 'all_rejected'
    //             // type == 'document' ? 'DOCUMENT_ALL_REJECT' : 'EVENT_ALL_REJECT'
    //             await notificationHelper.notify({ project_event_id, project_id, item_id, event_id, event_type: 'allreject', event_action: NOTIFICATION_REJECT_ALL[type], session_user: 0, event_users: projectEventUsers, event_name, local_event_name })
    //         } else {
    //             flag = 'rejected'
    //             // type == 'document' ? 'DOCUMENT_REJECT' : 'EVENT_REJECT'
    //             await notificationHelper.notify({ project_event_id, project_id, item_id, event_id, event_type: type == 'document' ? 'document' : 'event', event_action: NOTIFICATION_REJECT[type], session_user: req.user.id, event_users: projectEventUsers, event_name, local_event_name })
    //         }
    //     }

    //     // Add document accept event to network
    //     if (process.env.dev != 'true') {
    //         // await networkHelper.addEventSubmission(projectEvent.event_id, req.user.id, projectEvent.project_id, item_id, project_event_id, type, projectEvent.attachment, projectEvent.file_hash, 1, null, projectOrgNameArr, 0, flag, projectEvent.pdc_id)
    //     }

    //     res.json(projectEvent.acceptUsers)
    // } catch (err) {
    //     console.log('Error - > ', err)
    //     res.json({ error: err.message || err.toString() })
    // }
})

router.get('/:id/project-sub-events', [jwtAuth, userAuth], async (req, res) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)

        let projectEvents = []
        let eventUsers = []
        let projectEventsWithComment = []
        const parent_event_id = req.params.id
        const sub_event_ids = await ProjectSubEvents.findAll({ attributes: ['sub_event_id'], where: { parent_event_id } })
        if (sub_event_ids.length) {
            const _id = []
            const id = []
            var isNumbersOnly = /^\d+$/
            const query = {}

            sub_event_ids.map((subEvent) => {
                if (isNumbersOnly.test(subEvent.sub_event_id)) {
                    id.push(parseInt(subEvent.sub_event_id))
                    return subEvent
                }
                _id.push(subEvent.sub_event_id)
                return subEvent
            })
            if (_id.length) query.event_submission_id = { $in: _id }
            if (id.length) query.id = { $in: id }
            projectEvents = await MProjectEvent.find(query, '-image_base').lean().exec()
            const ids = _.uniq(
                [].concat.apply(
                    [],
                    projectEvents.map((doc) => doc.viewUsers.map((users) => users.user_id)),
                ),
            )
            eventUsers = await projectEventHelper.fetchProjectEventUsers(ids)
            projectEvents = await projectEventHelper.eventAcceptAndReject(projectEvents)
            projectEventsWithComment = await projectEventHelper.fetchEventComments(projectEvents)
        }

        res.json({ projectEvents: projectEventsWithComment, eventUsers })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch one project event
router.get('/:id', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { id } = req.params
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const projectEvent = await MProjectEvent.findOne({ event_submission_id: id })
        if (projectEvent) {
            const events = await Event.findOne({
                where: {
                    uniqId: projectEvent.event_id,
                },
                attributes: [
                    ['eventName', 'name'],
                    ['eventType', 'type'],
                ],
            })

            const stations = await Station.findAll({
                where: {
                    id: projectEvent.road_id,
                },
            })

            const project = await Project.findOne({
                where: {
                    id: projectEvent.project_id,
                },
                attributes: ['name', 'id'],
                include: [
                    {
                        model: ProjectCategory,
                        as: 'project_category',
                        include: [
                            {
                                model: ProjectPdcCategory,
                                include: [{ model: PdcOrganization }, { model: PdcOrgs }, { model: PdcParticipants }],
                            },
                        ],
                    },
                ],
            })

            const projectEventUsers = await ProjectEventUser.findAll({
                where: {
                    project_event_id: projectEvent.event_id,
                },
                separate: true,
                include: [
                    {
                        model: User,
                        include: [
                            {
                                model: UserTitle,
                            },
                        ],
                    },
                    {
                        model: Organizations,
                        include: [
                            {
                                model: OrganizationType,
                            },
                        ],
                    },
                ],
            })

            const formAnswerData = await FormAnswers.findOne({
                where: {
                    project_event_id: projectEvent.event_submission_id,
                },
            })

            const groupData = await Group.findAll({
                where: {
                    id: projectEvent.group_id,
                },
                attributes: [['groupID', 'name']],
            })

            const truckData = await Truck.findAll({
                where: {
                    id: projectEvent.truck_id,
                },
                attributes: [['truckID', 'name']],
            })

            const containerData = await Container.findAll({
                where: {
                    id: projectEvent.container_id,
                },
                attributes: [['containerID', 'name']],
            })

            const itemData = await Item.findAll({
                where: {
                    id: projectEvent.item_id,
                },
                attributes: ['id', ['itemID', 'name']],
            })

            const deviceData = await Device.findAll({
                where: {
                    id: projectEvent.device_id,
                },
                attributes: ['tag', ['deviceID', 'name']],
            })

            const ProjectCommentData = await ProjectComment.findAll({
                where: {
                    event_submission_id: projectEvent.event_submission_id,
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'organization_id', 'username'],
                        include: [
                            {
                                model: Organizations,
                                attributes: ['id', 'name'],
                            },
                        ],
                    },
                ],
            })

            const projectCommentStatusData = await ProjectCommentStatus.findAll({
                where: {
                    event_submission_id: projectEvent.event_submission_id,
                },
            })

            const documentAcceptedUserData = await DocumentAcceptedUser.findAll({
                where: {
                    project_event_id: projectEvent.event_submission_id,
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'organization_id', 'username'],
                        include: [
                            {
                                model: Organizations,
                                attributes: ['id', 'name'],
                            },
                        ],
                    },
                ],
            })

            const documentSeenUserData = await DocumentSeenUser.findAll({
                where: {
                    event_submission_id: projectEvent.event_submission_id,
                },
                include: [
                    {
                        model: Organizations,
                    },
                ],
            })

            const eventDocumentUserData = await EventDocumentUser.findAll({
                where: {
                    project_event_id: projectEvent.event_submission_id,
                },
            })

            const eventAcceptDocumentUserData = await EventAcceptDocumentUser.findAll({
                where: {
                    project_event_id: projectEvent.event_submission_id,
                },
            })

            const eventDetails = {
                projectEvent: projectEvent,
                event: events,
                stations: stations,
                project: project,
                projectEventUser: projectEventUsers,
                formAnswers: formAnswerData,
                group: groupData,
                truck: truckData,
                container: containerData,
                item: itemData,
                device: deviceData,
                projectComment: ProjectCommentData,
                projectCommentStatus: projectCommentStatusData,
                documentAcceptedUser: documentAcceptedUserData,
                documentSeenUser: documentSeenUserData,
                eventDocumentUser: eventDocumentUserData,
                eventAcceptDocumentUser: eventAcceptDocumentUserData,
            }

            res.json(eventDetails)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use(userAuth)

// Fetch Project Events for users
router.post('/fetch-user-manual-events', async (req, res) => {
    try {
        const { user_id, project_id } = req.body
        const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, project_id)
        res.json(userManualEvents)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All Project Events for users
router.post('/fetch-all-events', async (req, res) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const { user_id, user_role_id, project_id, group_id, container_id, truck_id, item_id, created_by, organization_id, attachment_type } = req.body
        // Filter by projects
        const mongooseWhere = { createdAt: { $lt: new Date(new Date(new Date() - process.env.EVENT_DELAY_TIME * 60000).toISOString()) } }
        const pdcWhere = {}
        const viewUsersWhere = {
            'viewUsers.user_id': parseInt(user_id),
            // 'viewUsers.is_parent_event': true,
            is_child_event: { $in: [null, false] },
        }
        const where_event = {}
        const isNotAdminRole = user_role_id != process.env.ROLE_ADMIN
        const isNotPublicUserRole = user_role_id != process.env.ROLE_PUBLIC_USER
        const isManagerRole = user_role_id == process.env.ROLE_MANAGER

        if (Array.isArray(project_id) && project_id.length > 0) {
            mongooseWhere.project_id = { $in: project_id }
            where_event.project_id = { [Op.in]: project_id }
        } else {
            mongooseWhere.project_id = project_id
            where_event.project_id = project_id
        }

        if (group_id) {
            mongooseWhere.group_id = group_id
        }
        if (truck_id) {
            mongooseWhere.truck_id = truck_id
        }
        if (container_id) {
            mongooseWhere.container_id = container_id
        }
        if (item_id) {
            mongooseWhere.item_id = item_id
        }
        if (attachment_type) {
            mongooseWhere.attachment_type = 2
        }

        const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: where_event.project_id } })

        if (isManagerRole && projectDetails ? projectDetails.user_id != user_id : isNotAdminRole && isNotPublicUserRole) {
            const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, mongooseWhere.project_id)
            if (userManualEvents.length) {
                const oid = new ObjectId(userManualEvents[0]._id)
                mongooseWhere._id = { $gte: oid }
                if (!item_id) {
                    mongooseWhere.item_id = { $in: userManualEvents.map((event) => parseInt(event.item_id)) }
                }
            } else {
                return res.json({ eventsList: [], usersList: [], pdcList: [] })
            }
        }

        if (created_by) {
            viewUsersWhere['viewUsers.created_by'] = parseInt(created_by)
        }
        if (organization_id && !created_by) {
            const organizationModel = await Organizations.findOne({
                attributes: ['id'],
                include: [
                    {
                        attributes: ['id'],
                        model: User,
                    },
                ],
                where: {
                    id: organization_id,
                },
            })
            const allUsers = organizationModel.users.map((user) => parseInt(user.id))
            if (allUsers.length) {
                viewUsersWhere['viewUsers.created_by'] = { $in: allUsers }
            }
        }

        if (Array.isArray(project_id) && project_id.length > 0) {
            const projectDetails = await Project.findAll({
                where: { id: { [Op.in]: project_id } },
            })
            const projectPDCArray = [].concat.apply(
                projectDetails.map((projectData) => projectData.pdc_name || ''),
                ['', '0'],
            )
            pdcWhere.pdc_id = { $nin: projectPDCArray }
        } else {
            const projectDetails = await Project.findOne({
                where: { id: project_id },
            })
            pdcWhere.pdc_id = { $nin: [projectDetails.pdc_name, '', '0'] }
        }

        const allLists = await MProjectEvent.aggregate([
            { $match: mongooseWhere },
            { $project: { image_base: false } },
            {
                $facet: {
                    usersLists: [
                        { $unwind: '$viewUsers' },
                        {
                            $match: Object.assign({}, mongooseWhere, {
                                'viewUsers.user_id': parseInt(user_id),
                                // 'viewUsers.is_parent_event': true,
                                is_child_event: { $in: [null, false] },
                            }),
                        },
                        {
                            $group: {
                                _id: '$viewUsers.created_by',
                            },
                        },
                    ],
                    eventsLists: [
                        { $match: Object.assign({}, mongooseWhere, viewUsersWhere) },
                        {
                            $group: {
                                _id: '$event_name',
                                event: { $first: '$$ROOT' },
                            },
                        },
                        {
                            $project: {
                                _id: false,
                                event_category_id: '$event.event_category_id',
                                event_id: '$event.event_id',
                                event_name: '$event.event_name',
                                local_event_name: '$event.local_event_name',
                                attachment_type: '$event.attachment_type',
                            },
                        },
                    ],
                    pdcLists: [{ $match: Object.assign({}, mongooseWhere, pdcWhere) }, { $group: { _id: '$pdc_id' } }],
                },
            },
        ]).exec()

        let usersList = []
        if (allLists[0].usersLists.length) {
            const eventUsers = allLists[0].usersLists.map((user) => user._id)
            usersList = await projectEventHelper.fetchProjectEventUsers(eventUsers)
        }

        let pdcList = []
        if (allLists[0].pdcLists.length) {
            const pdcId = allLists[0].pdcLists.map((pdc) => pdc._id)
            pdcList = await ProjectPdcCategory.findAll({
                where: { pdc_name: { [Op.in]: pdcId } },
                group: ['pdc_name'],
                include: [{ model: ProjectPdcCategoryEvents }],
            })
        }

        res.json({ eventsList: allLists[0].eventsLists || [], usersList, pdcList })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch unseen events
router.post('/fetch-unseen-events', async (req, res) => {
    try {
        const { user_id, project_id } = req.body
        const user_role_id = req.user.role_id
        if (user_role_id) {
            const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
            const isNotAdminRole = user_role_id != process.env.ROLE_ADMIN
            const isManagerRole = user_role_id == process.env.ROLE_MANAGER

            // Filter by projects
            const findQuery = { project_id }
            const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })
            if (isManagerRole && projectDetails ? projectDetails.user_id != user_id : isNotAdminRole) {
                const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, project_id)
                if (userManualEvents.length) {
                    findQuery.item_id = { $in: userManualEvents.map((event) => parseInt(event.item_id)) }
                } else {
                    return res.json({ count: 0 })
                }
            }
            findQuery.viewUsers = { $elemMatch: {} }
            findQuery.viewUsers.$elemMatch.user_id = user_id
            findQuery.viewUsers.$elemMatch.viewed = false
            findQuery.createdAt = { $lt: new Date(new Date(new Date() - process.env.EVENT_DELAY_TIME * 60000).toISOString()) }

            const eventCount = await MProjectEvent.countDocuments(findQuery).exec()

            res.json({ count: eventCount || 0 })
        } else {
            res.json({ count: 0 })
        }
    } catch (err) {
        console.log('err', err)
        res.json({ error: err.message || err.toString() })
    }
})

// // Only for track-item
// router.post('/fetch-puser-events-list', async (req, res) => {
//     try {
//         const { project_id, item_id } = req.body
//         const user_id = req.user.id
//         const query = `SELECT pe.event_id, pu.project_event_id FROM project_event_users pu inner JOIN project_events pe ON pu.project_event_id = pe.id where pu.user_id=${user_id} and pe.project_id = ${project_id} and pe.item_id = ${item_id}`
//         const projectEventlist = await db.sequelize.query(query)
//         const ids = []
//         let list = projectEventlist

//         if (projectEventlist.length) {
//             projectEventlist.map((pelist) =>
//                 pelist.map((list) => {
//                     ids.push(list.project_event_id)
//                 }),
//             )
//             let acceptDoc = []
//             if (ids.length > 0) {
//                 const query1 = `select project_event_id, is_rejected from document_accepted_users where project_event_id IN (${ids.join(',')})`
//                 acceptDoc = await db.sequelize.query(query1)
//             }
//             if (acceptDoc && acceptDoc.length) {
//                 list = projectEventlist.map((peList) =>
//                     peList.filter((peList) => {
//                         let acceptEventIsRejected = false
//                         acceptDoc.map((acpt) =>
//                             acpt.map((a) => {
//                                 if (a.project_event_id == peList.project_event_id && a.is_rejected == 1) {
//                                     acceptEventIsRejected = true
//                                 }
//                             }),
//                         )
//                         if (acceptEventIsRejected) {
//                             return false
//                         }
//                         return true
//                     }),
//                 )
//             }
//         }
//         res.json(list)
//     } catch (err) {
//         console.log('err', err)
//         res.json({ error: err.message || err.toString() })
//     }
// })

// // Fetch Projects event View and Accepet Organisation
// router.post('/fetch-view-accept-orgs', async (req, res) => {
//     try {
//         const { project_event_id } = req.body
//         const viewEventUser = await ProjectEventUser.findAll({
//             where: { project_event_id },
//             attributes: ['user_id', 'organization_id'],
//         })
//         const acceptEventUser = await EventAcceptDocumentUser.findAll({
//             where: { project_event_id },
//             attributes: ['user_id', 'organization_id'],
//         })
//         res.json({
//             view_orgs: _.map(viewEventUser, (view) => `${view.user_id}-${view.organization_id}`),
//             accept_orgs: _.map(acceptEventUser, (accept) => `${accept.user_id}-${accept.organization_id}`),
//         })
//     } catch (err) {
//         res.json({ error: err.message || err.toString() })
//     }
// })

// Fetch project documents
router.post('/fetch-project-documents', async (req, res) => {
    try {
        const group_id = req.body.group_id || null
        const truck_id = req.body.truck_id || null
        const container_id = req.body.container_id || null
        const item_id = req.body.item_id || null
        const doc_type_id = req.body.doc_type_id || null
        const { project_id, user_id, user_role_id, selected_participant } = req.body
        const isNotAdminRole = user_role_id != process.env.ROLE_ADMIN
        const isManagerRole = user_role_id == process.env.ROLE_MANAGER
        let userManualEvents = []
        let $match = {}
        const doc_type_name = req.body.doc_type_name || null
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)

        if (isNotAdminRole) userManualEvents = await projectEventHelper.fetchUserManualEvents(req, user_id, project_id)
        // Project and Container filter
        const where_event = {
            project_id,
            attachment_type: 2, // 2 for documents
        }
        $match.project_id = project_id
        $match.attachment_type = 2
        $match['viewUsers.user_id'] = user_id
        if (group_id) {
            where_event.group_id = group_id
            $match.group_id = group_id
        } else if (isNotAdminRole) {
            if (userManualEvents.length) {
                $match.group_id = { $in: userManualEvents.map((event) => parseInt(event.group_id)) }
            } else {
                return res.json({ projectDocuments: [], userManualEvents: [] })
            }
        }
        if (truck_id) {
            where_event.truck_id = truck_id
            $match.truck_id = truck_id
        } else if (isNotAdminRole) {
            if (userManualEvents.length) {
                $match.truck_id = { $in: userManualEvents.map((event) => parseInt(event.truck_id)) }
            } else {
                return res.json({ projectDocuments: [], userManualEvents: [] })
            }
        }
        if (container_id) {
            where_event.container_id = container_id
            $match.container_id = container_id
        } else if (isNotAdminRole) {
            if (userManualEvents.length) {
                $match.container_id = { $in: userManualEvents.map((event) => parseInt(event.container_id)) }
            } else {
                return res.json({ projectDocuments: [], userManualEvents: [] })
            }
        }
        if (item_id) {
            where_event.item_id = item_id
            $match.item_id = item_id
        } else if (isNotAdminRole) {
            if (userManualEvents.length) {
                $match.item_id = { $in: userManualEvents.map((event) => parseInt(event.item_id)) }
            } else {
                return res.json({ projectDocuments: [], userManualEvents: [] })
            }
        }
        if (doc_type_id) {
            $match.event_id = doc_type_id
        }
        if (doc_type_name) {
            $match.event_name = doc_type_name
        }

        if (selected_participant) {
            const organizationModel = await Organizations.findOne({
                attributes: ['id'],
                include: [
                    {
                        attributes: ['id'],
                        model: User,
                    },
                ],
                where: {
                    id: selected_participant,
                },
            })
            const allUsers = organizationModel.users.map((user) => user.id)
            if (allUsers) {
                $match['viewUsers.created_by'] = { $in: allUsers }
            }
        }

        const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })

        if (isManagerRole && projectDetails ? projectDetails.user_id != user_id : isNotAdminRole) {
            if (userManualEvents.length) {
                const oid = new ObjectId(userManualEvents[0]._id)
                $match._id = { $gte: oid }
                const query = [{ $sort: { createdAt: -1 } }, { $match }, { $project: { image_base: false } }]
                const projectDocuments = await MProjectEvent.aggregate(query).exec()
                const ids = _.uniq(
                    [].concat.apply(
                        [],
                        projectDocuments.map((doc) => doc.viewUsers.map((users) => users.user_id)),
                    ),
                )
                const eventUsers = await projectEventHelper.fetchProjectEventUsers(ids)
                let projectEvents = await projectEventHelper.fetchEventComments(projectDocuments)

                projectEvents = await projectEventHelper.eventAcceptAndReject(projectEvents)

                return res.json({ projectEvents, eventUsers, userManualEvents })
            } else {
                return res.json({ projectEvents: [], projectDocuments: [], userManualEvents: [], eventUsers: [] })
            }
        } else {
            const query = [{ $sort: { createdAt: -1 } }, { $match }, { $project: { image_base: false } }]
            // console.log('________________________________________________')
            // console.log(JSON.stringify(query))
            // console.log('________________________________________________')
            const projectDocuments = await MProjectEvent.aggregate(query).exec()
            const ids = _.uniq(
                [].concat.apply(
                    [],
                    projectDocuments.map((doc) => doc.viewUsers.map((users) => users.user_id)),
                ),
            )

            const eventUsers = await projectEventHelper.fetchProjectEventUsers(ids)
            let projectEvents = await projectEventHelper.fetchEventComments(projectDocuments)
            projectEvents = await projectEventHelper.eventAcceptAndReject(projectEvents)

            res.json({ projectEvents, eventUsers })
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Update project comment viewed
router.post('/view_comment', async (req, res) => {
    try {
        const { event_submission_id, is_viewed, user_id } = req.body

        const commentStatusUpdate = await ProjectCommentStatus.update(
            {
                is_viewed,
            },
            {
                where: {
                    event_submission_id,
                    user_id,
                },
            },
        )

        res.json({ success: !!commentStatusUpdate })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Project Event
router.post('/remove', async (req, res) => {
    try {
        await projectEventHelper._removeDuplicateEvents(req, req.body.id)

        res.json({ deleted: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Migration Mongo Db don't remove this
router.post('/migration-mongodb', async (req, res) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const count = await ProjectEvent.count()
        let offset = 0
        // let overallProjectEvents = []
        // let lastArray = []
        while (offset <= count) {
            // while (offset < 1000) {
            const projectEvent = await projectEventHelper.migrateProjectEvent(offset)
            const projectEventArray = projectEvent.map((pe) => {
                const newObj = {
                    groupName: (pe.group && pe.group.dataValues && pe.group.dataValues.name) || '',
                    truckName: (pe.truck && pe.truck.dataValues && pe.truck.dataValues.name) || '',
                    containerName: (pe.container && pe.container.dataValues && pe.container.dataValues.name) || '',
                    itemName: (pe.item && pe.item.dataValues && pe.item.dataValues.name) || '',
                    deviceName: (pe.device && pe.device.dataValues && pe.device.dataValues.name) || '',
                    deviceTag: (pe.device && pe.device.dataValues && pe.device.dataValues.tag) || '',
                    projectName: (pe.project && pe.project.dataValues && pe.project.dataValues.name) || '',
                    event_type: pe.event && pe.event.dataValues && pe.event.eventType,
                    viewUsers: [],
                    acceptUsers: [],
                    comments: [],
                    documentSeenusers: [],
                }

                if (pe.project_event_comments.length) {
                    newObj.comments = pe.project_event_comments.map((pcomment) => {
                        return {
                            user_id: pcomment.dataValues.user_id,
                            comment: pcomment.dataValues.comment,
                        }
                    })
                }

                if (pe.project_comment_statuses.length) {
                    newObj.commentStatus = pe.project_comment_statuses.map((status) => {
                        return {
                            user_id: status.dataValues.user_id,
                            is_viewed: status.dataValues.is_viewed,
                        }
                    })
                }

                if (pe.project_event_users.length) {
                    newObj.viewUsers = pe.project_event_users.map((p_user) => ({
                        user_id: p_user.dataValues.user_id,
                        created_by: p_user.dataValues.created_by,
                        organization_id: p_user.dataValues.organization_id,
                        viewed: p_user.dataValues.viewed,
                        is_parent_event: p_user.dataValues.is_parent_event,
                    }))
                }

                if (pe.project_event_answers.length) {
                    newObj.projectEventAnswer = pe.project_event_answers.map((ans) => ({
                        id: ans.dataValues.id,
                        user_id: ans.dataValues.user_id,
                        form_id: ans.dataValues.form_id,
                        project_event_id: ans.dataValues.project_event_id,
                        answers: ans.dataValues.answers,
                        createdAt: ans.dataValues.createdAt,
                        updatedAt: ans.dataValues.updatedAt,
                    }))
                }

                if (pe.event_accept_document_users.length) {
                    newObj.acceptUsers = pe.event_accept_document_users.map((acceptUsers) => {
                        let accepted = false
                        let rejected = false
                        if (pe.document_accepted_users.length) {
                            pe.document_accepted_users.map((docAcceptUsers) => {
                                if (docAcceptUsers.user_id == acceptUsers.user_id) {
                                    if (!docAcceptUsers.is_rejected) {
                                        accepted = true
                                    } else {
                                        rejected = true
                                    }
                                }
                            })
                        }
                        return {
                            organization_id: acceptUsers.organization_id,
                            user_id: acceptUsers.user_id,
                            accepted,
                            rejected,
                        }
                    })
                }
                if (pe.document_seen_users.length) {
                    newObj.documentSeenusers = pe.document_seen_users.map((seenUsers) => {
                        return seenUsers.dataValues.organization_id
                    })
                }

                return _.merge(pe.dataValues, newObj)
            })
            const projectEventsArrayUnique = _.uniqBy(projectEventArray, 'id')
            await MProjectEvent.insertMany(projectEventsArrayUnique)
            // overallProjectEvents = [].concat.apply(overallProjectEvents, projectEventsArrayUnique)
            // lastArray = projectEventArray
            offset += 1000
        }

        // console.log('overallProjectEvents --> ',overallProjectEvents)
        res.json({ success: true })
        // res.json(lastArray)
    } catch (err) {
        res.json({ err })
        console.log('migration -- > ', err)
    }
})

// Seen Document
router.post('/seen-document', async (req, res) => {
    try {
        const documentseenuser = await DocumentSeenUser.create({
            event_submission_id: req.body.event_submission_id,
            organization_id: req.body.organization_id,
        })
        res.json(documentseenuser)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/fetchBaseImage', async (req, res) => {
    try {
        const project = await ProjectEventImage.findOne({
            where: {
                project_event_id: req.body.id,
            },
        })
        if (project) {
            const data = await s3Helper.fetchS3File(`event_images/${project.image_name}`)
            if (data.Body) {
                const buffer = data.Body.toString('utf-8')
                res.json({ image_base: buffer })
            } else {
                return undefined
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch event visibility
router.get('/fetch/:id', async (req, res) => {
    try {
        const { id } = req.params
        const proejctEventUsers = await ProjectEvent.findOne({
            where: { id },
            include: [
                {
                    model: ProjectEventUser,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'organization_id', 'username'],
                            include: [
                                {
                                    model: Organizations,
                                    attributes: ['id', 'name'],
                                },
                            ],
                        },
                    ],
                },
            ],
        })
        res.json(proejctEventUsers)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Allow event submission
router.post('/allow-event-submission', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi(`events/submission/allow/${req.body.eventName}`, 'PATCH', req.body, 'AWS')
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// fetch Hidden Project Events
router.post('/fetch-hidden-project-event', async (req, res) => {
    try {
        const user_id = req.user.id
        const hiddenProjectEvnets = await UserHiddenEvent.findAll({
            where: {
                user_id,
            },
        })
        res.json(hiddenProjectEvnets)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Save Hidden Project Events
router.post('/save-hidden-project-events', async (req, res) => {
    try {
        const { event_submission_id } = req.body
        const user_id = req.user.id

        const hiddenEvents = []
        event_submission_id.map((project_event_id) => {
            hiddenEvents.push({ project_event_id, user_id })
        })

        await UserHiddenEvent.destroy({ where: { user_id } })
        const hiddenProjectEvnets = await UserHiddenEvent.bulkCreate(hiddenEvents)
        res.json(hiddenProjectEvnets)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/item-public-project-events', async (req, res) => {
    try {
        const { item_id } = req.body
        const { blockchain_name } = req.user.organization
        const projectEvents = await projectHelper.fetchDetailsByCode('project-event', [item_id], blockchain_name)
        res.json(projectEvents)
    } catch (err) {
        console.log(err)
    }
})

module.exports = router
