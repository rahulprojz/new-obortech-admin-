// Add Project Helper
const moment = require('moment-timezone')
const mongoose = require('mongoose')
const _ = require('lodash')
const db = require('../models')
const notificationHelper = require('./notification-helper.js')
const networkHelper = require('./network-helper.js')
const s3Helper = require('./s3-helper')
const networkHooks = require('../hooks/network-hooks')
const mdb = require('../models/mangoose/index.model')
// const { createAssetQuantity } = require('../../lib/api/assets-quantity')
const ObjectId = require('mongodb').ObjectID
const cronHelper = require('../helpers/cron-helper')
const fs = require('fs')
const fsp = fs.promises
const exec = require('await-exec')
const { fileTypeCheck, fileNameSplit } = require('../utils/globalHelpers')
const { getContainerByName } = require('../utils/projectEventHelpers/project-event-helper')
const { alertEventsArr } = require('../../utils/commonHelper')

const Project = db.projects
const User = db.users
const Event = db.events
const ProjectEventSQL = db.project_events
const ProjectSelection = db.project_selections
const ProjectParticipant = db.project_participants
const ProjectUser = db.project_users
const SelectionItem = db.selection_items
const SelectionDevice = db.selection_devices
const SelectionContainer = db.selection_containers
const SelectionGroup = db.selection_groups
const SelectionTruck = db.selection_trucks
const ProjectEvent = db.project_events
const ProjectEventUser = db.project_event_users
const ProjectComment = db.project_event_comments
const EventAcceptDocumentUser = db.event_accept_document_users
const ProjectCommentStatus = db.project_comment_status
const FormAnswers = db.form_answers
const Organizations = db.organizations
const TempNetworkEventSQL = db.temp_network_events
const Group = db.groups
const Truck = db.trucks
const Container = db.containers
const Item = db.items
const UserType = db.user_types
const UserTitle = db.user_titles
const ApprovedBy = db.approved_by
const Station = db.stations
const Device = db.devices
const ProjectCategory = db.project_categories
const DocumentAcceptedUser = db.document_accepted_users
const DocumentSeenUser = db.document_seen_users
const EventDocumentUser = db.event_document_users
const ProjectSubEvents = db.project_sub_events
const ProjectEventImage = db.project_event_image
const ProjectPdcCategory = db.project_pdc_categories
const PdcOrgs = db.pdc_orgs
const PdcOrgApprovals = db.pdc_org_approvals
const PdcParticipants = db.pdc_participants
const PdcOrganization = db.pdc_organizations
const ProjectPdcCategoryEvent = db.project_pdc_category_events
const ProjectEventAsset = db.project_event_assets
const AssetsQuantity = db.assets_quantities
const InventoryAssets = db.inventory_assets
const ProjectEventCategory = db.project_event_categories
const EventCategory = db.event_categories
const ProjectDocumentCategories = db.project_document_categories
const DocumentCategories = db.document_categories
const Events = db.events
const FormBuilder = db.form_builder
const { sequelize } = db

const { Op } = db.Sequelize

const fetchProjectEventUsers = async (ids) => {
    try {
        const eventUsers = await User.findAll({
            attributes: ['username', 'id', 'organization_id', 'role_id'],
            include: [
                {
                    model: UserTitle,
                },
                {
                    model: Organizations,
                    include: [
                        {
                            model: UserType,
                        },
                        {
                            model: ApprovedBy,
                            attributes: ['approved_by'],
                        },
                    ],
                },
            ],
            // isDeleted: 0 - we need to add this once project event collections was updated with all the datas of users and organizations
            where: { id: { [Op.in]: ids } },
        })

        return eventUsers
    } catch (err) {
        console.log(err)
    }
}

const getUserAllEvents = async (include, whereObj, prevTime, user_id) => {
    let userAllEvents = await ProjectEventUser.findAll({
        include,
        group: ['event_id', 'item_id'],
        where: whereObj,
        order: [['id', 'ASC']],
    })

    whereObj.createdAt = { [Op.gte]: prevTime }
    whereObj.created_by = user_id
    const userLastEvent = await ProjectEventUser.findAll({
        include,
        group: ['event_id', 'item_id'],
        where: whereObj,
        order: [['id', 'ASC']],
    })
    return (userAllEvents = [].concat.apply(userAllEvents, userLastEvent))
}

const fetchUserManualEvents = async (req, user_id, project_id) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)

        const users = await User.findAll({ where: { role_id: process.env.ROLE_ADMIN } })
        const adminUsers = []
        const prevTime = new Date(new Date(new Date() - process.env.EVENT_DELAY_TIME * 60000).toISOString())
        let userManualEvents = []
        let userHaveManualEvent = []
        if (users.length) {
            users.map((user) => adminUsers.push(user.id))
        }
        let projectID
        if (Array.isArray(project_id) && project_id.length) {
            projectID = { $in: project_id }
        } else if (project_id) {
            projectID = project_id
            const projectDetails = await Project.findOne({ attributes: ['id', 'user_id'], where: { id: project_id } })
            if (projectDetails) adminUsers.push(projectDetails.user_id)
        }

        const mongooseQuery = {
            event_id: {
                $nin: alertEventsArr,
            },
            is_child_event: { $in: [null, false] },
            project_id: projectID,
        }
        mongooseQuery.viewUsers = { $elemMatch: {} }
        mongooseQuery.viewUsers.$elemMatch.user_id = user_id
        mongooseQuery.createdAt = { $lt: new Date(new Date('2022-07-15 23:59:59').toISOString()) }

        const userManualEventBeforeDate = await MProjectEvent.findOne(mongooseQuery, { _id: 1 }, { sort: { createdAt: 1 } }).exec()
        if (!userManualEventBeforeDate) {
            mongooseQuery.createdAt = { $lt: prevTime }
            mongooseQuery.viewUsers.$elemMatch.created_by = { $in: adminUsers }
            userHaveManualEvent = await MProjectEvent.findOne(mongooseQuery, { _id: 1 }, { sort: { createdAt: 1 } }).exec()
            delete mongooseQuery.viewUsers.$elemMatch.created_by
            if (userHaveManualEvent) {
                const oid = new ObjectId(userHaveManualEvent._id)
                mongooseQuery._id = { $gte: oid }
            }
            // userManualEvents = await MProjectEvent.find(mongooseQuery, { group_id: 1, truck_id: 1, container_id: 1, item_id: 1, device_id: 1, event_id: 1 }, { sort: { _id: 1 } }).exec()
        }
        mongooseQuery.createdAt = { $lt: prevTime }

        if (userManualEventBeforeDate || userHaveManualEvent) {
            const userBeforeEvents = await MProjectEvent.aggregate([
                { $match: mongooseQuery },
                { $project: { group_id: 1, truck_id: 1, container_id: 1, item_id: 1, device_id: 1, event_id: 1 } },
                {
                    $group: {
                        _id: { event_name: '$event_name', item_id: '$item_id' },
                        event: { $first: '$$ROOT' },
                    },
                },
            ]).exec()

            mongooseQuery.createdAt = { [Op.gte]: prevTime }
            mongooseQuery.viewUsers.$elemMatch.created_by = user_id

            const userLastEvent = await MProjectEvent.aggregate([
                { $match: mongooseQuery },
                { $project: { group_id: 1, truck_id: 1, container_id: 1, item_id: 1, device_id: 1, event_id: 1 } },
                {
                    $group: {
                        _id: '$event_name',
                        event: { $first: '$$ROOT' },
                    },
                },
            ]).exec()

            userManualEvents = [].concat.apply(userBeforeEvents, userLastEvent)
            userManualEvents = userManualEvents.map((userEvent) => userEvent.event)
        }

        return userManualEvents
    } catch (error) {
        console.log(error)
        return false
    }
}

const _getProjectDetails = async (project_id, item_id) => {
    try {
        const returnObj = {
            group_id: '',
            truck_id: '',
            container_id: '',
            pdc_name: '',
            project_name: '',
            group_name: '',
            truck_name: '',
            container_name: '',
            item_name: '',
        }
        const projectDetails = await Project.findOne({
            include: [
                {
                    model: ProjectSelection,
                    include: [
                        {
                            model: SelectionGroup,
                            include: Group,
                        },
                        {
                            model: SelectionTruck,
                            include: Truck,
                        },
                        {
                            model: SelectionContainer,
                            include: Container,
                        },
                        {
                            model: SelectionItem,
                            include: Item,
                        },
                    ],
                },
            ],
            where: {
                id: project_id,
            },
        })
        let containersIdx = 0
        if (projectDetails) {
            projectDetails.project_selections.map((selection, i) => {
                if (selection.selection_items.length > 0) {
                    if (selection.selection_items[0].item_id == item_id) {
                        containersIdx = i
                    }
                }
            })
            returnObj.group_id = projectDetails.project_selections[containersIdx].selection_groups[0].group_id
            returnObj.truck_id = projectDetails.project_selections[containersIdx].selection_trucks[0].truck_id
            returnObj.container_id = projectDetails.project_selections[containersIdx].selection_containers[0].container_id
            returnObj.pdc_name = projectDetails.pdc_name
            returnObj.project_name = projectDetails.name
            returnObj.group_name = projectDetails.project_selections[containersIdx].selection_groups[0].group.groupID
            returnObj.truck_name = projectDetails.project_selections[containersIdx].selection_trucks[0].truck.truckID
            returnObj.container_name = projectDetails.project_selections[containersIdx].selection_containers[0].container.containerID
            returnObj.item_name = projectDetails.project_selections[containersIdx].selection_items[0].item.itemID
        }
        return returnObj
    } catch (err) {
        console.log(err)
        return false
    }
}

// Add Project Event
const _addProjectEvent = async (req) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        let attachment = ''
        let file_hash = ''
        let image_url = ''
        const event_type = req.body.type
        const {
            user_id,
            organization_id,
            itemIds,
            event_category_id,
            event_id,
            worker_id = null,
            event_name,
            local_event_name,
            project_id,
            document_deadline,
            title,
            description,
            location,
            pdcName,
            due_date,
            formbuilderId,
            formjsonanswers,
            groupName,
            isAssetEvent = false,
            truckName,
            containerName,
            isPublicEvent,
            event_submission_id,
            isIotEventOn,
            isIotEventOff,
            device_id,
        } = req.body
        const itemsArray = JSON.parse(itemIds)
        // const currentdatetime = moment().tz(process.env.TIME_ZONE).format('YYYY-MM-DD HH:mm:ss')
        const attachment_type = event_type === 'document' ? 2 : 1 // 1 for image and 2 for document
        let projectEvent = null
        let image_base = req.files ? (req.files.file ? req.body.image_base : '') : ''
        const projectEvents = []
        if (!image_base && req.body.projectEventId) {
            projectEvent = await MProjectEvent.findOne({ event_submission_id: req.body.projectEventId }).exec()
            if (projectEvent.image_base) {
                image_base = projectEvent.image_base
            } else {
                const imageDetails = await ProjectEventImage.findOne({
                    where: {
                        project_event_id: req.body.projectEventId,
                    },
                })
                if (imageDetails && imageDetails.image_name) {
                    image_path = imageDetails.image_name
                    const data = await s3Helper.fetchS3File(`event_images/${image_path}`)
                    if (data.Body) {
                        image_base = data.Body.toString('utf-8')
                    }
                }
            }
        }
        if (req.files && req.files.file) {
            const response = await s3Helper.uploadFile(req.files.file, user_id, event_submission_id)
            attachment = response.file_location
            image_url = response.image_location
            file_hash = response.file_hash

            if (response.error) {
                console.log('upload error --> ', response)
                return { error: response.error }
            }
        } else if (projectEvent != null) {
            attachment = projectEvent.attachment || ''
            image_url = projectEvent.image_url || ''
            file_hash = projectEvent.file_hash || ''
        }
        const projectEventAdd = await itemsArray.map(async (item, i) => {
            const eventSubmissionId = networkHooks._generateUniqId()
            const subEventIdes = req.body.subEventsID ? JSON.parse(req.body.subEventsID) : {}
            // Get group, truck and container by item
            const projectDetails = await _getProjectDetails(project_id, item.id)
            let form_data
            if (formbuilderId) {
                form_data = await FormBuilder.findOne({
                    where: { id: formbuilderId },
                })
            }
            if (projectDetails) {
                const event_data = {
                    _id: new mongoose.Types.ObjectId(),
                    event_id,
                    event_submission_id: eventSubmissionId,
                    worker_id: worker_id || null,
                    project_id: parseInt(project_id),
                    group_id: parseInt(projectDetails.group_id) || 1,
                    truck_id: parseInt(projectDetails.truck_id) || 1,
                    container_id: parseInt(projectDetails.container_id),
                    item_id: parseInt(item.id),
                    event_name,
                    local_event_name,
                    event_type,
                    event_category_id,
                    attachment,
                    attachment_type,
                    image_url,
                    file_hash,
                    form_id: formbuilderId,
                    document_deadline: document_deadline || 1,
                    isActive: 1,
                    road_id: 0,
                    current_temp: 0.0,
                    current_hum: 0.0,
                    // image_base: req.files.file ? req.body.image_base : image_base,
                    title,
                    description,
                    location,
                    pdc_id: pdcName || projectDetails.pdc_name,
                    isAddedInBlockchain: false,
                    has_sub_events: !!subEventIdes && subEventIdes.length > 0,
                    projectName: projectDetails.project_name,
                    groupName: projectDetails.group_name,
                    truckName: projectDetails.truck_name,
                    containerName: projectDetails.container_name,
                    itemName: projectDetails.item_name,
                    isAssetEvent,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPublicEvent,
                    isIotEventOn,
                    isIotEventOff,
                    device_id: device_id || 0,
                }

                // If start date is selected
                if (due_date && due_date != 'null') {
                    event_data.due_date = due_date
                }
                const projectEvent = await ProjectEventSQL.create(event_data)
                const viewUsers = await _addEventUsers(req, user_id, organization_id, true, projectEvent)
                const acceptUsers = await _addAcceptUsers(req, event_data)
                if (image_base) {
                    // Add Project Event Image
                    const updatedPath = await s3Helper.uploadS3Base64(image_base, event_data.event_submission_id)
                    await ProjectEventImage.create({
                        project_event_id: event_data.event_submission_id,
                        image_name: updatedPath,
                    })
                }
                event_data.viewUsers = viewUsers
                event_data.acceptUsers = acceptUsers
                if (!!formbuilderId && formbuilderId != 'null') {
                    if (isAssetEvent) {
                        const answerData = formjsonanswers ? JSON.parse(formjsonanswers) : []
                        if (answerData.length > 0) {
                            await checkAndUpdateAsset(answerData, organization_id, 'remove')
                        }
                    }
                    event_data.projectEventAnswer = [
                        {
                            form_id: parseInt(formbuilderId),
                            answers: formjsonanswers,
                            form_data: form_data && JSON.stringify(form_data.data),
                            user_id,
                        },
                    ]
                } else event_data.projectEventAnswer = []
                const projectevent = await MProjectEvent.create(event_data)
                if (req.body.subEventsID) {
                    await addProjectSubEvents(req, projectevent.event_submission_id)
                }
                await addTempNetworkEvent(req, event_data, user_id, event_type, attachment, file_hash)

                projectEvents.push(projectevent)
            }
            return item
        })
        if (itemsArray.length > 0) await Promise.all(projectEventAdd)

        return projectEvents
    } catch (err) {
        console.log(err)
    }
}

const eventAcceptAndReject = async (document) => {
    try {
        const submissionIds = document.map((doc) => doc.event_submission_id)

        const event_accept_document_users = await EventAcceptDocumentUser.findAll({
            where: {
                project_event_id: { [Op.in]: submissionIds },
            },
        })
        const document_accepted_users = await DocumentAcceptedUser.findAll({
            where: {
                project_event_id: { [Op.in]: submissionIds },
            },
        })
        const seen_users = await DocumentSeenUser.findAll({
            where: {
                event_submission_id: { [Op.in]: submissionIds },
            },
        })
        const newDocument = document.map((doc) => {
            const doc_accepted = document_accepted_users.filter((accept) => accept.project_event_id == doc.event_submission_id)
            const event_accept = event_accept_document_users.filter((accept) => accept.project_event_id == doc.event_submission_id)
            const document_seen_users = seen_users.filter((seen) => seen.event_submission_id == doc.event_submission_id)
            doc.document_accepted_users = doc_accepted
            doc.event_accept_document_users = event_accept
            doc.document_seen_users = document_seen_users

            return doc
        })
        return newDocument
    } catch (err) {
        console.log(err)
        return document
    }
}

// Add events to temp table before storing to Network
const addTempNetworkEvent = async (req, projectevent, user_id, event_type, attachment, file_hash) => {
    try {
        const currentdatetime = moment().tz(process.env.TIME_ZONE).format('YYYY-MM-DD HH:mm:ss')
        const TempNetworkEvent = await mdb.temp_network_event(req.user.organization.blockchain_name)
        // Get project organizatoins to add visibility in EXPLORER events
        const visible_to_users = await _getProjectUsers(req)
        const eventUsers = req.body.event_users ? JSON.parse(req.body.event_users) : {}
        const event_users = eventUsers && eventUsers.length ? eventUsers.map((user) => parseInt(user.split('-')[0])) : []
        const network_event_data = await getNestedProjectEvents(req, projectevent.event_submission_id, currentdatetime, visible_to_users, user_id, event_type, attachment, file_hash, event_users)
        await TempNetworkEvent.create({
            project_event_id: `${projectevent._id}`,
            event: JSON.stringify(network_event_data),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    } catch (err) {
        console.log(err)
    }
}

const getNestedProjectEvents = async (req, projectEventId, currentdatetime, visible_to_users, user_id, event_type, attachment, file_hash, event_users) => {
    const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)

    const projectEvent = await MProjectEvent.findOne({ event_submission_id: projectEventId }).exec()
    const network_event_data = {
        event_id: projectEvent.event_id,
        event_submission_id: projectEvent.event_submission_id,
        user_id,
        project_id: projectEvent.project_id.toString(),
        item_id: projectEvent.item_id,
        project_event_id: projectEvent._id,
        event_type,
        attachment,
        file_hash,
        doc_status: 1,
        due_date: projectEvent.due_date,
        visible_to_users,
        pdc_name: projectEvent.pdc_id,
        currentdatetime,
        document_deadline: projectEvent.document_deadline,
        event_users,
        event_name: projectEvent.event_name,
        itemName: projectEvent.itemName,
    }
    const eventChilds = []
    if (projectEvent.has_sub_events) {
        const allChilds = await ProjectSubEvents.findAll({
            where: {
                parent_event_id: projectEvent.event_submission_id,
            },
        })
        if (allChilds) {
            const promises = allChilds.map(async (event) => {
                const childevnt = await getNestedProjectEvents(req, event.sub_event_id, currentdatetime, visible_to_users, user_id, event_type, attachment, file_hash, event_users)
                childevnt.parent_id = projectEvent.event_submission_id
                eventChilds.push(childevnt)
            })
            await Promise.all(promises)
        }
    }
    network_event_data.childrens = eventChilds
    return network_event_data
}

const addProjectSubEvents = async (req, project_event_submission_id) => {
    try {
        const subEventsID = req.body.subEventsID && JSON.parse(req.body.subEventsID)
        const promises = subEventsID.map(async (event) => {
            await duplicateEvents(req, event.event_submission_id, project_event_submission_id)
        })
        await Promise.all(promises)
    } catch (err) {
        console.log(err)
    }
}

const getOldEvents = async (req, event_submission_id) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const isNumbersOnly = /^\d+$/
        const query = {}

        if (isNumbersOnly.test(event_submission_id)) {
            query.id = parseInt(event_submission_id)
        } else {
            query.event_submission_id = event_submission_id
        }
        const oldEvent = await MProjectEvent.findOne(query).lean().exec()

        return oldEvent
    } catch (err) {
        console.log(err)
    }
}

// Add Project event image for sbuEvent
const _addSubEventImage = async (old_event_id, new_event_id) => {
    try {
        const imageBase = await ProjectEventImage.findOne({
            where: {
                project_event_id: old_event_id,
            },
        })
        console.log(' imageBase --> ', !!imageBase)
        if (imageBase) {
            await ProjectEventImage.create({
                image_base: imageBase.image_base,
                project_event_id: new_event_id,
            })
        }
    } catch (err) {
        console.log(err)
    }
}

const duplicateEvents = async (req, child_project_event_submission_id, parent_event_submission_id) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const oldEvent = await getOldEvents(req, child_project_event_submission_id)
        if (oldEvent) {
            const user_id = oldEvent.viewUsers[0].created_by
            const { organization_id } = req.body
            oldEvent.isAddedInBlockchain = 0
            const old_event_id = `${oldEvent.id}`
            const old_event_id_m = `${oldEvent.event_submission_id}`
            delete oldEvent.id
            oldEvent.event_submission_id = networkHooks._generateUniqId()
            if (!oldEvent.pdc_id) {
                oldEvent.pdc_id = req.body.pdcName
            }
            delete oldEvent._id
            oldEvent._id = new mongoose.Types.ObjectId()
            oldEvent.form_id = oldEvent.form_id || ''
            oldEvent.is_child_event = true
            // const projectEventSub = await ProjectEventSQL.create(oldEvent)
            oldEvent.viewUsers = await _addEventUsers(req, user_id, organization_id, false)
            const newEvent = await MProjectEvent.create(oldEvent)
            newEvent.childrens = []
            newEvent.parents = []
            delete newEvent.image_base

            newEvent.childrens.push(newEvent.event_submission_id)
            newEvent.parents.push(parent_event_submission_id)
            await ProjectSubEvents.create({ parent_event_id: `${parent_event_submission_id}`, sub_event_id: `${newEvent.event_submission_id}` })
            await _addAcceptUsersForDuplicateEvent(req, old_event_id_m, newEvent.event_submission_id)
            if (oldEvent.has_sub_events) {
                const eventRelation = await ProjectSubEvents.findAll({
                    where: {
                        parent_event_id: { [Op.or]: [old_event_id, old_event_id_m] },
                    },
                })
                // Loop through childs
                if (eventRelation) {
                    const eventRelationPormisses = eventRelation.map(async (event, i) => {
                        await duplicateEvents(req, event.sub_event_id, newEvent.event_submission_id)
                    })
                    await Promise.all(eventRelationPormisses)
                }
            }
            // await _addSubEventImage(old_event_id_m, newEvent.event_submission_id)
            // return newEvent
        }
        return
    } catch (err) {
        console.log(err)
    }
}

// Add project complete event
const projectCompleteEvent = async (req, project_id) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const event_id = process.env.projectFinishedEventId
        const project = await Project.findOne({
            include: [
                {
                    model: ProjectSelection,
                    include: [
                        {
                            model: SelectionItem,
                            include: [{ model: Item, attributes: ['itemID'] }],
                        },
                        {
                            model: SelectionContainer,
                            include: [{ model: Container, attributes: ['containerID'] }],
                        },
                        {
                            model: SelectionTruck,
                            include: [{ model: Truck, attributes: ['truckID'] }],
                        },
                        {
                            model: SelectionGroup,
                            include: [{ model: Group, attributes: ['groupID'] }],
                        },
                    ],
                },
                {
                    model: ProjectParticipant,
                },
                {
                    model: ProjectUser,
                    include: [
                        {
                            model: User,
                            attributes: ['organization_id', 'role_id'],
                        },
                    ],
                },
            ],
            where: { id: project_id },
        })

        if (project) {
            const { container_id, container } = project.project_selections[0].selection_containers[0]
            const { item_id, item } = project.project_selections[0].selection_items[0]
            const { truck_id, truck } = project.project_selections[0].selection_trucks[0]
            const { group_id, group } = project.project_selections[0].selection_groups[0]

            const event = await Event.findOne({
                attributes: ['eventName', 'mongolianName', 'event_category_id'],
                where: { uniqId: event_id },
            })
            const event_type = 'alert'
            // event
            const event_data = {
                _id: new mongoose.Types.ObjectId(),
                projectName: project.name,
                groupName: group.groupID,
                truckName: truck.truckID,
                containerName: container.containerID,
                itemName: item.itemID,
                event_submission_id: networkHooks._generateUniqId(),
                event_id,
                event_name: event.eventName,
                local_event_name: event.mongolianName,
                event_category_id: event.event_category_id,
                container_id,
                item_id,
                pdc_id: project.pdc_name,
                project_id,
                truck_id,
                group_id,
                attachment: '',
                attachment_type: '',
                image_url: '',
                file_hash: '',
                isActive: 1,
                event_type,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            const projectEvent = await ProjectEventSQL.create(event_data)

            const projectEventUserEntries = []
            project.project_users.map((pUser) => {
                if (pUser.user.role_id != process.env.ROLE_PUBLIC_USER) {
                    projectEventUserEntries.push({
                        project_event_id: projectEvent.id,
                        organization_id: pUser.user.organization_id,
                        user_id: pUser.user_id,
                        created_by: process.env.ADMIN_USER_ID,
                        // is_parent_event: true,
                    })
                }
            })
            await ProjectEventUser.bulkCreate(projectEventUserEntries)

            event_data.viewUsers = projectEventUserEntries
            // Need to remove this line once mongoDB movedto live
            const projectevent = await MProjectEvent.create(event_data)

            if (projectevent) {
                // Send notification
                await notificationHelper.notify({ project_event_id: projectevent.event_submission_id, project_id, item_id, event_id, event_type: 'event', event_action: 'ALERT', session_user: 0, event_name: projectevent.event_name, itemName: projectevent.itemName })
            }
            // if (process.env.dev != 'true') {
            // Get project visible organizatoins
            const visible_to_users = []
            // Get Organisations By Project ID
            const project_organizations = project.project_participants || []
            if (project_organizations && project_organizations.length) {
                // Get Org IDs from Organisations Array
                const orgs_id = project_organizations.map((project_organization) => project_organization.participant_id)
                // findAll Users By Project Participant Organisations
                const orgsUsers = await User.findAll({
                    include: Organizations,
                    where: {
                        organization_id: { [Op.in]: orgs_id },
                        isDeleted: 0,
                    },
                })
                // Username with Organisation Name
                orgsUsers.map((user) => visible_to_users.push(`${user.username} - ${user.organization.blockchain_name}`))
            }
            const event_json = {
                event_id,
                user_id: req.user.id,
                // user_id: process.env.ADMIN_USER_ID,
                project_id,
                item_id,
                project_event_id: projectevent.event_submission_id,
                event_submission_id: projectevent.event_submission_id,
                visible_to_users,
                event_type: 'event',
                pdc_name: project.pdc_name,
            }
            await networkHelper.addEventSubmission(event_json)
            // }
        }
    } catch (err) {
        console.log(err)
    }
}

// Get project visible organizatoins
const _getProjectUsers = async (req) => {
    const visible_to_users = []
    // Get Organisations By Project ID
    const project_organizations = await ProjectParticipant.findAll({
        include: [
            {
                model: Organizations,
            },
        ],
        where: { project_id: req.body.project_id },
    })
    if (project_organizations) {
        // Get Org IDs from Organisations Array
        const orgs_id = project_organizations.map((project_organization) => project_organization.participant_id)
        // findAll Users By Project Participant Organisations
        const orgsUsers = await User.findAll({
            include: [
                {
                    model: Organizations,
                    attributes: ['blockchain_name'],
                },
            ],
            where: {
                organization_id: { [Op.in]: orgs_id },
                isDeleted: 0,
            },
        })
        // Username with Organisation Name
        orgsUsers.map((user) => visible_to_users.push(`${user.username} - ${user.organization.blockchain_name}`))
    }

    return visible_to_users
}

// Add project event users
const _addEventUsers = async (req, user_id, organization_id, is_parent_event, projectEvent = {}) => {
    try {
        // Will show this event to all users
        let eventUsers = user_id ? [{ project_event_id: projectEvent.id, organization_id, user_id: req.user.id, created_by: user_id, is_parent_event }] : []
        const viewers = req.body.event_users ? JSON.parse(req.body.event_users) : {}
        if (viewers && viewers.length > 0) {
            await viewers.map(async (userOrgs) => {
                if (!userOrgs) {
                    return false
                }
                const [euser_id, org_id] = userOrgs.split('-').map(Number)
                if (org_id && euser_id) {
                    eventUsers.push({
                        project_event_id: projectEvent.id,
                        organization_id: org_id,
                        user_id: euser_id,
                        created_by: user_id,
                        is_parent_event,
                    })
                    const subEvents = req.body.subEventsID && JSON.parse(req.body.subEventsID)
                    if (subEvents) {
                        await subEvents.map(async (event) => {
                            const isAvailable = event.viewUsers.find((user) => user.user_id == euser_id && organization_id == org_id)

                            if (isAvailable) return false
                            eventUsers.push({
                                project_event_id: projectEvent.id,
                                organization_id: org_id,
                                user_id: euser_id,
                                created_by: user_id,
                                is_parent_event: false,
                            })
                        })
                    }
                }
            })
        }
        eventUsers = _.uniqBy(eventUsers, 'user_id')
        if (projectEvent.id) {
            // Need to Remove this live when we move MongoDB on live
            await ProjectEventUser.bulkCreate(eventUsers)
        }

        return eventUsers
    } catch (err) {
        console.log(err)
    }
}

// Add accepted document users
const _addAcceptUsers = async (req, event_data) => {
    try {
        const acceptUsers = []
        const acceptors = req.body.accept_users ? JSON.parse(req.body.accept_users) : {}
        if (acceptors && acceptors.length > 0) {
            acceptors.map((userOrgs) => {
                const [users_id, orgs_id] = userOrgs.split('-').map(Number)
                acceptUsers.push({
                    project_event_id: event_data.event_submission_id,
                    user_id: users_id,
                    organization_id: orgs_id,
                })
            })
        }
        await EventAcceptDocumentUser.bulkCreate(acceptUsers)
        return acceptUsers
    } catch (err) {
        console.log(err)
    }
}

// Add accepted document users
const _addAcceptUsersForDuplicateEvent = async (req, old_event_submission_id, new_event_submission_id) => {
    try {
        const eventAcceptDocUsers = await EventAcceptDocumentUser.findAll({
            where: { project_event_id: old_event_submission_id },
        })
        const docAcceptUsers = await DocumentAcceptedUser.findAll({
            where: { project_event_id: old_event_submission_id },
        })
        const eventAcceptDocUserArr = []
        const docAcceptUsersArr = []

        eventAcceptDocUsers.map((ev) => {
            const event = ev.dataValues
            event.project_event_id = new_event_submission_id
            delete event.id
            eventAcceptDocUserArr.push(event)
        })

        docAcceptUsers.map((ev) => {
            const event = ev.dataValues
            event.project_event_id = new_event_submission_id
            delete event.id
            docAcceptUsersArr.push(event)
        })
        await EventAcceptDocumentUser.bulkCreate(eventAcceptDocUserArr)
        await DocumentAcceptedUser.bulkCreate(docAcceptUsersArr)
    } catch (err) {
        console.log(err)
    }
}

// const _addCommentForDuplicateEvent = async (req, old_event_submission_id, new_event_submission_id) => {
//     try {
//         const comments = await ProjectComment.findAll({
//             where: {
//                 event_submission_id: old_event_submission_id,
//             },
//         })
//         const commentStatus = await ProjectCommentStatus.findAll({
//             where: {
//                 event_submission_id: old_event_submission_id,
//             },
//         })
//         const projectComments = []
//         const projectCommentStatus = []

//         comments.map((comment) => {
//             comment.event_submission_id = new_event_submission_id
//             delete comment.id
//             projectComments.push(comment)
//         })

//         commentStatus.map((status) => {
//             status.event_submission_id = new_event_submission_id
//             delete status.id
//             projectCommentStatus.push(comment)
//         })

//         await ProjectComment.bulkCreate(projectComments)
//         await ProjectCommentStatus.bulkCreate(projectCommentStatus)
//     } catch (err) {
//         console.log(err)
//     }
// }

// Get temp event and send to network
const sendEventToNetwork = async () => {
    try {
        // It will get all events added 6 mins before
        const prevTime = moment().subtract(process.env.EVENT_DELAY_TIME, 'minutes').format('YYYY-MM-DD HH:mm:ss')
        const tempNetworkEvents = await TempNetworkEventSQL.findAll({
            where: {
                createdAt: {
                    [Op.lt]: prevTime,
                },
            },
            order: [['id', 'ASC']],
        })

        if (tempNetworkEvents) {
            tempNetworkEvents.map(async (temp_event) => {
                const event_json = temp_event.event ? JSON.parse(temp_event.event) : {}
                if (event_json) {
                    // Add event to Fabric network, we will show these Events on blockchain explorer
                    if (process.env.dev != 'true') {
                        await networkHelper.addEventSubmission(event_json)

                        // Send notification to users
                        await notificationHelper.notify({
                            project_event_id: event_json.event_submission_id,
                            project_id: event_json.project_id,
                            item_id: event_json.item_id,
                            event_id: event_json.event_id,
                            event_type: event_json.event_type,
                            event_action: 'SUBMIT',
                            session_user: event_json.user_id,
                            event_users: event_json.event_users,
                            document_deadline: event_json.document_deadline || '',
                            currentdatetime: event_json.currentdatetime || '',
                            event_name: event_json.event_name,
                            itemName: event_json.itemName,
                        })

                        // delete event from temp
                        await temp_event.destroy()
                    }
                }
            })
        }
    } catch (err) {
        console.log('Error in sendEventToNetwork -- ', err)
    }
}

// Add project Comment Status
const addprojectcommentstatus = async (projectEvent, comment_id, user_id) => {
    try {
        const { event_submission_id } = projectEvent
        const eventUsers = projectEvent.viewUsers
        const commentStatus = await ProjectCommentStatus.findOne({
            where: { event_submission_id },
        })

        if (!commentStatus) {
            const users = []

            /* Fetch Users linked to organization */
            if (eventUsers.length) {
                eventUsers.map((event) => {
                    users.push(event.user_id)
                })
            }

            if (users.length) {
                /* Insert data in projectstatus table */
                const commentStatusArr = []
                users.map(async (userId) => {
                    let isviewed = 0
                    if (userId == user_id) {
                        isviewed = 1
                    }
                    commentStatusArr.push({
                        event_submission_id,
                        user_id: userId,
                        comment_id,
                        is_viewed: isviewed,
                    })
                })
                await ProjectCommentStatus.bulkCreate(commentStatusArr)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

const _removeDuplicateEvents = async (req, event_submission_id) => {
    try {
        const TempNetworkEvent = await mdb.temp_network_event(req.user.organization.blockchain_name)
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const mEventData = await MProjectEvent.findOne({ event_submission_id }).exec()
        const { viewUsers, isAssetEvent, projectEventAnswer } = mEventData
        const eventData = await ProjectEvent.findOne({ where: { event_submission_id } })
        const createdByUser = viewUsers.find((user) => viewUsers[0].created_by == user.user_id)
        const formBuilderData = projectEventAnswer.length !== 0 && projectEventAnswer[0].answers ? JSON.parse(`${projectEventAnswer[0].answers}`) : []

        const subEvents = await ProjectSubEvents.findAll({ where: { parent_event_id: event_submission_id } })

        await ProjectComment.destroy({ where: { event_submission_id } })
        await DocumentAcceptedUser.destroy({ where: { project_event_id: event_submission_id } })
        await EventAcceptDocumentUser.destroy({ where: { project_event_id: event_submission_id } })
        await DocumentSeenUser.destroy({ where: { event_submission_id } })
        await TempNetworkEvent.deleteOne({ project_event_id: mEventData._id })
        await mEventData.remove()

        // Restore the asset quantity when remove the event
        if (isAssetEvent) {
            if (formBuilderData.length > 0) {
                await checkAndUpdateAsset(formBuilderData, createdByUser.organization_id, 'add')
            }
        }
        if (eventData) {
            await ProjectEventUser.destroy({ where: { project_event_id: eventData.id } })
            await ProjectEvent.destroy({ where: { id: eventData.id } })
        }

        // Remove Project event image
        ProjectEventImage.destroy({ where: { project_event_id: event_submission_id } }).then(() => {})

        if (subEvents && subEvents.length) {
            const deleteSubEvents = subEvents.map(async (sevent_id) => {
                await _removeDuplicateEvents(req, sevent_id.sub_event_id)
            })
            await Promise.all(deleteSubEvents)

            await ProjectSubEvents.destroy({ where: { parent_event_id: event_submission_id } })
        }
    } catch (err) {
        console.log(err)
        throw err
    }
}

const migrateProjectEvent = async (offset) => {
    try {
        const projectEvents = await ProjectEvent.findAll({
            // attributes: {
            //     exclude: ['image_base'],
            // },
            include: [
                {
                    model: ProjectComment,
                },
                {
                    model: Event,
                },
                {
                    model: ProjectEventUser,
                },
                {
                    model: EventAcceptDocumentUser,
                },
                {
                    model: EventDocumentUser,
                },
                {
                    model: DocumentAcceptedUser,
                    separate: true,
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
                    order: [['id', 'DESC']],
                },
                {
                    model: DocumentSeenUser,
                    separate: true,
                    include: [
                        {
                            model: Organizations,
                        },
                    ],
                    order: [['id', 'DESC']],
                },
                {
                    model: Station,
                },
                {
                    model: Project,
                    attributes: ['name', 'id', 'pdc_name'],
                    include: [
                        {
                            model: ProjectCategory,
                            as: 'project_category',
                        },
                    ],
                },
                {
                    model: Group,
                    attributes: [['groupID', 'name']],
                },
                {
                    model: Truck,
                    attributes: [['truckID', 'name']],
                },
                {
                    model: Container,
                    attributes: [['containerID', 'name']],
                },
                {
                    model: Item,
                    attributes: ['id', ['itemID', 'name']],
                },
                {
                    model: Device,
                    attributes: ['tag', ['deviceID', 'name']],
                },
                {
                    model: ProjectCommentStatus,
                    separate: true,
                },
                {
                    model: FormAnswers,
                    separate: true,
                },
            ],
            limit: 1000,
            offset,
            order: [['id', 'DESC']],
        })

        return projectEvents
    } catch (err) {
        console.log('migrateProjectEvent --  ', JSON.stringify(err))
    }
}

const fetchEventComments = async (projectEvents) => {
    try {
        let projectEvent = []
        const eventSubmissionIds = projectEvents.map((event) => event.event_submission_id)
        const comments = await ProjectComment.findAll({
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
            order: [['id', 'DESC']],
            where: { event_submission_id: { [Op.in]: eventSubmissionIds } },
        })
        const commentStatus = await ProjectCommentStatus.findAll({ where: { event_submission_id: { [Op.in]: eventSubmissionIds } } })
        projectEvent = projectEvents.map((event) => {
            event.comments = comments.filter((comment) => comment.event_submission_id == event.event_submission_id)
            event.commentStatus = commentStatus.filter((comment) => comment.event_submission_id == event.event_submission_id)
            return event
        })

        return projectEvent
    } catch (err) {
        console.log(err)
    }
}

const addDocumentAPI = async (req) => {
    const file_types = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    try {
        const file = req.files.file
        const user_id = req.user.id

        if (file) {
            if (!file_types.includes(file.type)) {
                return false
            }

            //Validate file size
            if (file.size > 3 * 1024 * 1024) {
                return false
            }

            let response

            //Upload DOCX
            if (file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const response = await convertAPIDocument(file, user_id)
                return response
            }

            //Upload PPTX
            if (file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                const response = await convertAPIDocument(file, user_id)
                return response
            }

            //Upload XLSX
            if (file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                const response = await convertAPIDocument(file, user_id)
                return response
            }

            //Upload PDF
            if (file.type == 'application/pdf') {
                const response = await saveAPIDocumentPDF(file, user_id, req.body.event_submission_id)
                return response
            }

            //Upload Image
            if (file.type == 'image/png' || file.type == 'image/jpg' || file.type == 'image/jpeg') {
                const response = await saveAPIDocumentImage(file, user_id, req.body.event_submission_id)
                return response
            }
        }
    } catch (err) {
        console.log(err)
    }
}

const convertAPIDocument = async (filedata, user_id) => {
    try {
        const upload_path = 'server/upload/'
        const oldpath = filedata.path
        const clean_file_name = filedata.name.toString().replace(/[^a-zA-Z0-9.]/g, '')
        const destpath = `${upload_path}${clean_file_name.toLowerCase()}`

        // Delete all old files
        const allFiles = fs.readdirSync(upload_path)
        if (allFiles) {
            const pFiles = allFiles.map(async (file) => {
                if (file.includes(`page_${user_id}`)) {
                    await fsp.unlink(upload_path + file)
                }
            })
            await Promise.all(pFiles)
        }

        const images = []
        let base64 = ''
        // Read the file
        await fsp.readFile(oldpath).then(async (data) => {
            // Write the file
            const bufdata = Buffer.from(data)
            await fsp.writeFile(destpath, bufdata).then(async (data) => {
                // Convert file to PDF
                await exec(`libreoffice --headless --convert-to pdf ${destpath} --outdir ${upload_path}`).then(async (error, stdout, stderr) => {
                    if (error.stderr) {
                        return { success: false }
                    }

                    // Split PDF and get first page data
                    const currentTimeStamp = Date.now().toString().slice(-4)
                    const pdf_file_path = destpath.replace('.docx', '.pdf').replace('.xlsx', '.pdf').replace('.pptx', '.pdf')

                    await exec(`python3 python-scripts/split-pdf.py ${pdf_file_path} ${user_id} ${currentTimeStamp}`).then(async (error, stdout, stderr) => {
                        if (error.stderr) {
                            return { success: false }
                        }

                        const allFiles = fs.readdirSync(upload_path)
                        if (allFiles) {
                            allFiles.map((file, i) => {
                                if (file.includes(`page_${user_id}`)) {
                                    images.push(file)
                                    if (file.includes('_1_')) {
                                        base64 = fs.readFileSync(upload_path + file, 'base64')
                                    }
                                }
                            })
                        }
                        // Delete PDF file
                        await fsp.unlink(pdf_file_path)
                    })
                })
            })
        })
        return { success: true, images, base64 }
    } catch (err) {
        console.log('err', err)
        return err
    }
}

const saveAPIDocumentImage = async (filedata, user_id, event_submission_id) => {
    try {
        const upload_path = 'server/upload/'
        // Delete all old files
        const allFiles = fs.readdirSync(upload_path, { withFileTypes: true })
        if (allFiles) {
            const pFiles = allFiles.map(async (file) => {
                if (fileTypeCheck(file.name)) await fsp.unlink(upload_path + file.name)
            })
            await Promise.all(pFiles)
            const currentTimeStamp = Date.now().toString().slice(-4)

            const oldpath = filedata.path
            const clean_file_name = filedata.name.replace(/[^a-zA-Z0-9.]/g, '')
            const destpath = `${upload_path}${clean_file_name.toLowerCase()}_${currentTimeStamp}`
            // Read the file
            const readData = await fsp.readFile(oldpath)
            // Write the file
            const bufdata = Buffer.from(readData)
            const writeData = await fsp.writeFile(destpath, bufdata)

            const images = []
            let base64 = ''
            const dataFiles = await fs.readdirSync(upload_path)
            if (dataFiles) {
                const dFiles = dataFiles.map(async (file, i) => {
                    if (file.includes(currentTimeStamp)) {
                        images.push(file)
                        base64 = fs.readFileSync(upload_path + file, 'base64')
                    }
                })
                await Promise.all(dFiles)

                //Save PDF
                const pdfImages = upload_path + images[0]
                const filename = `server/upload/${filedata.name
                    .toString()
                    .replace(/[^a-zA-Z0-9.]/g, '')
                    .replace(/.jpeg|.jpg|.png/gi, '.pdf')
                    .replace('.pdf', `_${user_id}_${event_submission_id}.pdf`)}`

                await exec(`/usr/bin/img2pdf ${pdfImages} -o ${filename.toLowerCase()}`).then(async (error, stdout, stderr) => {
                    if (error.stderr) {
                        return { success: false }
                    }

                    const allFiles = await fsp.readdir(upload_path)
                    if (allFiles) {
                        const aFiles = allFiles.map(async (file) => {
                            if (file.includes(`page_${user_id}`)) {
                                await fsp.unlink(upload_path + file)
                            }
                        })
                        await Promise.all(aFiles)
                    }
                })

                return { success: true, base64 }
            }
        }
    } catch (err) {
        console.log('err', err)
        return err
    }
}

const saveAPIDocumentPDF = async (filedata, userId, event_submission_id) => {
    try {
        const currentTimeStamp = Date.now().toString().slice(-4)
        const tempPath = filedata.path
        const uploadPath = 'server/upload/'

        const pdfDestPath = uploadPath + filedata.name.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase()

        // Delete all old files
        const allFiles = fs.readdirSync(uploadPath)
        if (allFiles) {
            const pFiles = allFiles.map(async (file) => {
                if (file.includes(`page_${userId}`)) {
                    fsp.unlink(uploadPath + file)
                }
            })
            Promise.all(pFiles)
        }
        const images = []
        let base64 = ''
        // Save original PDF
        await fsp.readFile(tempPath).then(async (data) => {
            // Write the file
            const bufdata = Buffer.from(data)
            await fsp.writeFile(pdfDestPath, bufdata).then(async () => {
                // Convert PDF to Image

                await exec(`python3 python-scripts/split-pdf.py ${pdfDestPath} ${userId} ${currentTimeStamp}`).then(async (error, stdout, stderr) => {
                    if (error.stderr) {
                        res.json({ success: false, message: error.stderr })
                    }

                    const newImageFiles = fs.readdirSync(uploadPath)
                    if (newImageFiles) {
                        const allImageFiles = newImageFiles.map(async (file) => {
                            if (file.includes(`page_${userId}`)) {
                                images.push(file)
                                if (file.includes(`page_${userId}_1_`)) {
                                    base64 = fs.readFileSync(uploadPath + file, 'base64')
                                }
                            }
                        })
                        Promise.all(allImageFiles)
                    }
                })
            })
        })

        const pdfImages = uploadPath + images[0]
        const filename = `server/upload/${filedata.name
            .toString()
            .replace(/[^a-zA-Z0-9.]/g, '')
            .replace(/.jpeg|.jpg|.png/gi, '.pdf')
            .replace('.pdf', `_${userId}_${event_submission_id}.pdf`)}`
        if (filedata) {
            await exec(`/usr/bin/img2pdf ${pdfImages} -o ${filename.toLowerCase()}`).then(async (error, stdout, stderr) => {
                if (error.stderr) {
                    res.json({ success: false })
                }

                const allFiles = fs.readdirSync(uploadPath)
                if (allFiles) {
                    const filesData = allFiles.map(async (file) => {
                        if (file.includes(`page_${userId}`)) {
                            await fsp.unlink(uploadPath + file)
                        }
                    })
                    Promise.all(filesData)
                }
            })
            return { success: true, images, base64 }
        }
    } catch (err) {
        console.log('err', err)
        return err
    }
}

const saveAPIEventImage = async (req) => {
    const filedata = req.files.file
    const upload_path = 'server/upload/'
    // Delete all old files
    const allFiles = fs.readdirSync(upload_path, { withFileTypes: true })
    if (allFiles) {
        const pFiles = allFiles.map(async (file) => {
            if (fileTypeCheck(file.name)) await fsp.unlink(upload_path + file.name)
        })
        await Promise.all(pFiles)
    }
    const currentTimeStamp = Date.now().toString().slice(-4)

    const oldpath = filedata.path
    const clean_file_name = filedata.name.replace(/[^a-zA-Z0-9.]/g, '')
    const destpath = `${upload_path}${clean_file_name.toLowerCase()}_${currentTimeStamp}`
    // Read the file
    const readData = await fsp.readFile(oldpath)
    // Write the file
    const bufdata = Buffer.from(readData)
    const writeData = await fsp.writeFile(destpath, bufdata)

    const images = []
    const dataFiles = await fs.readdirSync(upload_path)
    if (dataFiles) {
        const dFiles = dataFiles.map(async (file, i) => {
            if (file.includes(currentTimeStamp)) {
                images.push(file)
            }
        })
        Promise.all(dFiles)
    }
    const base64 = fs.readFileSync(upload_path + images[0], 'base64')
    //res.json({ success: true, images, base64 })

    const pdf_upload_path = 'server/upload/'
    const { event_submission_id } = req.body
    const pdfImages = upload_path + images[0]
    const filename = `server/upload/${filedata.name
        .toString()
        .replace(/[^a-zA-Z0-9.]/g, '')
        .replace(/.jpeg|.jpg|.png/gi, '.pdf')
        .replace('.pdf', `_${req.user.id}_${event_submission_id}.pdf`)}`

    await exec(`/usr/bin/img2pdf ${pdfImages} -o ${filename.toLowerCase()}`).then(async (error, stdout, stderr) => {
        if (error.stderr) {
            res.json({ success: false })
        }

        const allFiles = fs.readdirSync(pdf_upload_path)
        if (allFiles) {
            const aFiles = allFiles.map(async (file) => {
                if (file.includes(`page_${req.user.id}`)) {
                    await fsp.unlink(pdf_upload_path + file)
                }
            })
            Promise.all(aFiles)
        }
    })
    return { success: true, base64 }
}
const mapEventAndAcceptUsers = async (users) => {
    let acceptUserArr = await Promise.all(
        users
            .map(async (user) => {
                const userData = await User.findOne({
                    where: { id: user, isDeleted: 0 },
                    attributes: ['id', 'organization_id'],
                })
                if (userData) return userData.id + '-' + userData.organization_id
            })
            .filter((u) => u),
    )
    return JSON.stringify(acceptUserArr)
}

const appendStringEventAndAcceptUsers = async (users) => {
    const userArr = users.split(',')
    let acceptUserArr = await Promise.all(
        userArr
            .map(async (user) => {
                const userData = await User.findOne({
                    where: { unique_id: user, isDeleted: 0 },
                    attributes: ['id', 'organization_id'],
                })
                if (userData) return userData.id + '-' + userData.organization_id
            })
            .filter((u) => u),
    )
    return JSON.stringify(acceptUserArr)
}
const mapItemIds = async (itemIds) => {
    let itemIdsArr = await Promise.all(
        itemIds.map(async (itemId) => {
            const item = await Item.findOne({ where: { itemID: itemId.itemID } })
            const data = item.dataValues
            const containerData = await getContainerByName(itemId.container_name)
            data['container_id'] = containerData.id
            return data
        }),
    )
    return JSON.stringify(itemIdsArr)
}

const getPDCDetails = async (event_id, pdcName) => {
    const pdcDetails = await ProjectPdcCategory.findOne({
        where: { is_deleting: 0, pdc_name: pdcName.toLowerCase() },
        include: [{ model: PdcOrganization }, { model: PdcOrgs }, { model: PdcOrgApprovals }, { model: PdcParticipants }, { model: ProjectPdcCategoryEvent, where: { event_id } }],
    })
    return pdcDetails
}

const checkAndUpdateAsset = async (answerData, organization_id, action) => {
    const eventAsset = { transfer: [], remove: [] }
    answerData.map((fBData) => {
        if (fBData.name && fBData.name.includes('Transfer')) {
            const transferData = fBData.value
            eventAsset.transfer = [...eventAsset.transfer, ...transferData]
        } else if (fBData.name && fBData.name.includes('Remove')) {
            const removeData = fBData.value
            eventAsset.remove = [...eventAsset.remove, ...removeData]
        }
    })
    eventAsset.transfer.length > 0 && (await addRemoveAssets(organization_id, eventAsset.transfer, action))
    eventAsset.remove.length > 0 && (await addRemoveAssets(organization_id, eventAsset.remove, action))
}

const findAsset = async (organization_id, asset_code) => {
    const where = {
        organization_id,
        asset_code,
    }
    const existAsset = await AssetsQuantity.findOne({
        where,
        raw: true,
    })
    return { where, existAsset }
}

const addRemoveAssets = async (organization_id, addRemoveData, action) => {
    try {
        const promises = addRemoveData.map(async (item) => {
            const { where, existAsset } = await findAsset(organization_id, item.asset_code)
            if (existAsset) {
                const quantity = parseInt(item.quantity)
                const available_quantity = action == 'remove' ? existAsset.available_quantity - quantity : existAsset.available_quantity + quantity
                await AssetsQuantity.update({ available_quantity }, { where })
            }
        })
        await Promise.all(promises)
    } catch (err) {
        console.log(err, 'err')
    }
}

const removeAssetQuantity = async (organization_id, removeData) => {
    try {
        const promises = removeData.map(async (item) => {
            const { where, existAsset } = await findAsset(organization_id, item.asset_code)
            if (existAsset) {
                await AssetsQuantity.update({ removed_quantity: parseInt(existAsset.removed_quantity) + parseInt(item.quantity) }, { where })
            }
        })
        await Promise.all(promises)
    } catch (err) {
        console.log(err, 'err')
    }
}

const transferAssetQuantity = async (supplierOrgId, receiverOrgId, transferData) => {
    try {
        const createArr = []
        const promises = transferData.map(async (item) => {
            const supplier = await findAsset(supplierOrgId, item.asset_code)
            const receiver = await findAsset(receiverOrgId, item.asset_code)

            if (supplier.existAsset) {
                await AssetsQuantity.update({ transferred_quantity: parseInt(supplier.existAsset.transferred_quantity) + parseInt(item.quantity) }, { where: supplier.where })
            }
            if (receiver.existAsset) {
                await AssetsQuantity.update({ available_quantity: parseInt(receiver.existAsset.available_quantity) + parseInt(item.quantity), transferred_quantity: parseInt(receiver.existAsset.transferred_quantity) + parseInt(item.quantity) }, { where: receiver.where })
            } else {
                createArr.push({ asset_code: item.asset_code, organization_id: receiverOrgId, available_quantity: parseInt(item.quantity), transferred_quantity: parseInt(item.quantity), created_quantity: 0, removed_quantity: 0 })
            }
        })
        await Promise.all(promises)
        if (createArr.length > 0) {
            await AssetsQuantity.bulkCreate(createArr)
        }
    } catch (err) {
        console.log(err, 'err')
    }
}

const createAssetQuantity = async (organization_id, createData) => {
    try {
        const createArr = []
        const promises = createData.map(async (item) => {
            const { where, existAsset } = await findAsset(organization_id, item.asset_code)
            if (existAsset) {
                await AssetsQuantity.update({ available_quantity: existAsset.available_quantity + parseInt(item.quantity), created_quantity: parseInt(existAsset.created_quantity) + parseInt(item.quantity) }, { where })
            } else {
                createArr.push({ asset_code: item.asset_code, organization_id, available_quantity: parseInt(item.quantity), transferred_quantity: 0, created_quantity: parseInt(item.quantity), removed_quantity: 0 })
            }
        })
        await Promise.all(promises)
        if (createArr.length > 0) {
            await AssetsQuantity.bulkCreate(createArr)
        }
    } catch (err) {
        console.log(err, 'err')
    }
}

const addProjectEventAssets = async (formBuilderDatas, projectEvent) => {
    try {
        if (formBuilderDatas.length > 0) {
            const { event_submission_id, supplier, receiver } = projectEvent
            const orgAssets = await InventoryAssets.findAll({
                attributes: ['asset_code'],
                where: { organization_id: receiver.organization_id },
            })
            let assetsArray = []
            const otherAssets = []
            const eventAsset = { create: [], transfer: [], remove: [] }
            const assetData = (asset, action) => {
                asset.length > 0 &&
                    asset.map((item) =>
                        assetsArray.push({
                            assets_code: item.asset_code,
                            action: action,
                            quantity: item.quantity,
                        }),
                    )
            }
            formBuilderDatas.map((fBData) => {
                if (fBData.name && fBData.name.includes('Transfer')) {
                    const transferData = fBData.value
                    assetData(transferData, 'transfer')
                    eventAsset.transfer = [...eventAsset.transfer, ...transferData]
                } else if (fBData.name && fBData.name.includes('Create')) {
                    const createData = fBData.value
                    assetData(createData, 'create')
                    eventAsset.create = [...eventAsset.create, ...createData]
                } else if (fBData.name && fBData.name.includes('Remove')) {
                    const removeData = fBData.value
                    assetData(removeData, 'remove')
                    eventAsset.remove = [...eventAsset.remove, ...removeData]
                }
            })
            eventAsset.create.length > 0 && (await createAssetQuantity(supplier.organization_id, eventAsset.create))
            eventAsset.transfer.length > 0 && (await transferAssetQuantity(supplier.organization_id, receiver.organization_id, eventAsset.transfer))
            eventAsset.remove.length > 0 && (await removeAssetQuantity(supplier.organization_id, eventAsset.remove))
            assetsArray =
                assetsArray.length > 0
                    ? assetsArray.map((asset) => {
                          if (!orgAssets.some((orgAsset) => orgAsset.asset_code == asset.assets_code) && asset.action == 'transfer') otherAssets.push(asset.assets_code)
                          return Object.assign({}, asset, { project_event_id: event_submission_id, supplier_org_id: supplier.organization_id, receiver_org_id: receiver.organization_id })
                      })
                    : []
            if (otherAssets.length) {
                const inventoryArray = []
                const promises = otherAssets.map(async (asset_code) => {
                    const assetData = await InventoryAssets.findOne({ where: { asset_code } })
                    if (assetData) {
                        inventoryArray.push(Object.assign({}, assetData.dataValues, { asset_category_id: 1, organization_id: receiver.organization_id, is_viewed: 0, id: null }))
                    }
                })
                await Promise.all(promises)
                await InventoryAssets.bulkCreate(inventoryArray)
            }
            await ProjectEventAsset.bulkCreate(assetsArray)
        }
    } catch (err) {
        console.log(err)
    }
}

const onIotonandOff = async (formBuilderData, projectEvent) => {
    try {
        const { project_id, item_id, isIotEventOn, isIotEventOff } = projectEvent
        const formDataPromise = await formBuilderData.map(async (fBData) => {
            if (fBData.name && (fBData.name.includes('IotOff') || fBData.name.includes('IotOn'))) {
                let device_id = fBData.activeDevice.id
                let is_started = false
                if (fBData.name.includes('IotOff')) {
                    is_started = false
                }
                if (fBData.name.includes('IotOn')) {
                    is_started = true
                }
                const projectSelection = await ProjectSelection.findAll({
                    where: { project_id },
                    include: [
                        {
                            model: SelectionDevice,
                            attributes: ['id', 'device_id', 'selection_id'],
                            require: true,
                            where: { device_id },
                        },
                        {
                            model: SelectionItem,
                            attributes: ['id', 'item_id', 'selection_id', 'is_start'],
                            require: true,
                            where: { item_id },
                        },
                    ],
                })
                const selectionDeviceId = projectSelection[0].selection_devices[0].id
                const selectionItemId = projectSelection[0].selection_items[0].id
                if (!projectSelection[0].selection_items[0].is_started) await SelectionItem.update({ is_start: true, start_date_time: sequelize.fn('NOW') }, { where: { id: selectionItemId } })
                await SelectionDevice.update({ is_started }, { where: { id: selectionDeviceId } })
            }
        })
        await Promise.all(formDataPromise)
        await cronHelper.cronRestartApi()
    } catch (err) {
        console.log(err)
    }
}

const getEventList = async (id) => {
    try {
        const projectData = await Project.findOne({
            where: { id },
            attributes: [],
            include: [
                {
                    model: ProjectCategory,
                    include: [
                        {
                            model: ProjectEventCategory,
                            include: [{ model: EventCategory, include: [{ model: Events }] }],
                        },
                        {
                            model: ProjectDocumentCategories,
                            include: [{ model: DocumentCategories, include: [{ model: Events }] }],
                        },
                    ],
                },
            ],
        })

        const documentArray = []
        const eventArray = []
        if (projectData && projectData.project_category) {
            if (projectData.project_category.project_event_categories.length > 0) {
                projectData.project_category.project_event_categories.map((eventCat) => eventArray.push(eventCat.event_category.events))
            }
            if (projectData.project_category.project_document_categories.length > 0) {
                projectData.project_category.project_document_categories.map((documentCat) => documentArray.push(documentCat.document_category.events))
            }
        }

        return { eventList: [].concat.apply([], eventArray || []), documentList: [].concat.apply([], documentArray || []) }
    } catch (err) {
        console.log(err)
    }
}

const getEventType = async (id) => {
    try {
        const eventData = await Event.findOne({
            where: { uniqId: id },
            attributes: ['eventType', 'eventName', 'mongolianName'],
        })

        return eventData && eventData.dataValues
    } catch (err) {
        console.log(err)
    }
}
const getSubmissionEventType = async (id) => {
    try {
        const eventData = await ProjectEventSQL.findOne({
            where: { event_submission_id: id },
            attributes: ['event_id', 'item_id'],
        })
        const uniqueID = eventData && eventData.dataValues.event_id
        const itemId = eventData && eventData.dataValues.item_id
        const eventDataType = await getEventType(uniqueID)
        return { eventDataType: eventDataType.eventType, itemId }
    } catch (err) {
        console.log(err)
    }
}

exports.migrateProjectEvent = migrateProjectEvent
exports.fetchUserManualEvents = fetchUserManualEvents
exports._addProjectEvent = _addProjectEvent
exports.sendEventToNetwork = sendEventToNetwork
exports.projectCompleteEvent = projectCompleteEvent
exports.addprojectcommentstatus = addprojectcommentstatus
exports._removeDuplicateEvents = _removeDuplicateEvents
exports.fetchProjectEventUsers = fetchProjectEventUsers
exports.fetchEventComments = fetchEventComments
exports.eventAcceptAndReject = eventAcceptAndReject
exports.addDocumentAPI = addDocumentAPI
exports.saveAPIEventImage = saveAPIEventImage
exports.mapEventAndAcceptUsers = mapEventAndAcceptUsers
exports.mapItemIds = mapItemIds
exports.appendStringEventAndAcceptUsers = appendStringEventAndAcceptUsers
exports.getPDCDetails = getPDCDetails
exports.addProjectEventAssets = addProjectEventAssets
exports.createAssetQuantity = createAssetQuantity
exports.transferAssetQuantity = transferAssetQuantity
exports.removeAssetQuantity = removeAssetQuantity
exports.onIotonandOff = onIotonandOff
exports.getEventList = getEventList
exports.getEventType = getEventType
exports.getSubmissionEventType = getSubmissionEventType
exports.checkAndUpdateAsset = checkAndUpdateAsset
