const express = require('express')
const db = require('../models')
const Project = db.projects
const ProjectUser = db.project_users
const ProjectParticipant = db.project_participants
const User = db.users
const Organization = db.organizations
const Worker = db.workers
const ProjectCategory = db.project_categories
const ProjectDocumentCategory = db.project_document_categories
const ProjectEventCategory = db.project_event_categories
const DocumentCategory = db.document_categories
const EventCategory = db.event_categories
const Event = db.events
const ProjectSelection = db.project_selections
const SelectionContainer = db.selection_containers
const Container = db.containers
const SelectionItem = db.selection_items
const Item = db.items
const SubmissionRequest = db.submission_requests
const SubmissionRequestParticipant = db.submission_request_participants
const SubmissionRequestDocumentParticipant = db.submission_request_document_participants
const SubmissionRequestRecipient = db.submission_request_recipients
const Op = db.Sequelize.Op
const router = express.Router()
const string = require('../helpers/LanguageHelper')

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

/**
 * Fetch Project for logged in user
 */
router.get('/projects', async (req, res) => {
    try {
        let projects = []
        projects = await ProjectUser.findAll({
            attributes: ['project_id', 'user_id'],
            include: [
                {
                    attributes: ['name', 'id'],
                    model: Project,
                    where: {
                        is_completed: 0,
                        isDraft: 0,
                    },
                },
            ],
            where: {
                user_id: req.session.passport.user,
            },
        })

        let projectRecords = []
        projects.map((projectRow) => {
            projectRecords.push({ id: projectRow.project.id, name: projectRow.project.name })
        })

        res.json(projectRecords)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Fetch Project details including its partciipant and event details
 */
router.post('/projectDetails', async (req, res) => {
    try {
        let project = {}
        project = await Project.findOne({
            attributes: ['name', 'id'],
            include: [
                {
                    attributes: ['id'],
                    model: ProjectParticipant,
                    include: [
                        {
                            attributes: ['name', 'id'],
                            model: Organization,
                            where: {
                                isDeleted: 0,
                            },
                        },
                    ],
                },
                {
                    attributes: ['id'],
                    model: ProjectSelection,
                    include: [
                        {
                            attributes: ['id'],
                            model: SelectionContainer,
                            include: [
                                {
                                    attributes: ['containerId', 'id'],
                                    model: Container,
                                },
                            ],
                        },
                        {
                            attributes: ['id'],
                            model: SelectionItem,
                            include: [
                                {
                                    attributes: ['itemId', 'id'],
                                    model: Item,
                                },
                            ],
                        },
                    ],
                },
                {
                    attributes: ['id'],
                    model: ProjectCategory,
                    include: [
                        {
                            attributes: ['id'],
                            model: ProjectDocumentCategory,
                            include: [
                                {
                                    attributes: ['id'],
                                    model: DocumentCategory,
                                    include: [
                                        {
                                            attributes: ['name', 'id'],
                                            model: Event,
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            attributes: ['id'],
                            model: ProjectEventCategory,
                            include: [
                                {
                                    attributes: ['id'],
                                    model: EventCategory,
                                    include: [
                                        {
                                            attributes: ['name', 'id'],
                                            model: Event,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            where: {
                id: req.body.project_id,
            },
        })

        res.json(project)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

/**
 * Submit Request
 */
router.post('/submitRequest', async (req, res) => {
    const { user_id, project_id, container_id, item_id, event_id, event_type, recipients, participants, doc_participants, organization_id } = req.body
    const eventDetails = await Event.findOne({ where: { uniqId: event_id }, attributes: ['id'] })
    return SubmissionRequest.create({ project_id, user_id, container_id, item_id, event_id: eventDetails.id, event_type, is_viewed: 0, is_submitted: 0 }).then(async function (request) {
        if (request) {
            //Participants
            let requestParticipants = [
                {
                    participant_id: organization_id,
                    submission_id: request.id,
                },
            ]
            participants.map(async (participant) => {
                requestParticipants.push({
                    participant_id: participant,
                    submission_id: request.id,
                })
            })
            //Doc participants
            let requestDocParticipants = [
                {
                    participant_id: organization_id,
                    submission_id: request.id,
                },
            ]
            doc_participants.map(async (participant) => {
                requestDocParticipants.push({
                    participant_id: participant,
                    submission_id: request.id,
                })
            })
            //Event recipients
            let requestRecipients = []
            recipients.map(async (recipient) => {
                requestRecipients.push({
                    worker_id: recipient.id,
                    submission_id: request.id,
                })
            })
            await SubmissionRequestParticipant.bulkCreate(requestParticipants)
            await SubmissionRequestRecipient.bulkCreate(requestRecipients)
            if (event_type == 'document') {
                await SubmissionRequestDocumentParticipant.bulkCreate(requestDocParticipants)
            }
            res.json({ status: true })
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    })
})

router.get('/fetchSubmissionRequests', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            attributes: ['id', 'user_id', 'project_id', 'container_id', 'item_id', 'event_id', 'event_type'],
            include: [
                {
                    attributes: ['id', 'name'],
                    model: Project,
                },
                {
                    attributes: ['containerId', 'id'],
                    model: Container,
                },
                {
                    attributes: ['itemId', 'id'],
                    model: Item,
                },
                {
                    attributes: ['name', 'id'],
                    model: Event,
                },
                {
                    attributes: ['participant_id'],
                    model: SubmissionRequestParticipant,
                    include: [
                        {
                            attributes: ['name'],
                            model: Organization,
                            require: true,
                            where: {
                                isDeleted: 0,
                            },
                        },
                    ],
                },
                {
                    attributes: ['participant_id'],
                    model: SubmissionRequestDocumentParticipant,
                    include: [
                        {
                            attributes: ['name'],
                            model: Organization,
                            require: true,
                            where: {
                                isDeleted: 0,
                            },
                        },
                    ],
                },
                {
                    attributes: ['worker_id', 'is_submitted'],
                    model: SubmissionRequestRecipient,
                    include: [
                        {
                            attributes: ['first_name', 'last_name'],
                            model: Worker,
                        },
                    ],
                },
            ],
            order: [['id', 'DESC']],
        }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
        }
        const submissionRequestsRecords = limit ? await SubmissionRequest.findAndCountAll(filter) : await SubmissionRequest.findAll(filter)

        res.json(submissionRequestsRecords)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/remove', async (req, res) => {
    try {
        const record = await SubmissionRequest.destroy({
            where: { id: req.body.id },
        })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
