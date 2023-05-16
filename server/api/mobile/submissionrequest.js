// Load dependencies
const express = require('express')

const router = express.Router()
const passport = require('passport')
const multipart = require('connect-multiparty')

const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })
// const string = require('../../../utils/LanguageTranslation.js');
const string = require('../../helpers/LanguageHelper')

// Load Models
const db = require('../../models')
const ProjectEventHelper = require('../../helpers/project-event-helper.js')

const SubmissionRequest = db.submission_requests
const SubmissionRequestRecipient = db.submission_request_recipients
const SubmissionRequestParticipants = db.submission_request_participants
const SubmissionRequestDocumentParticipant = db.submission_request_document_participants
const ProjectEvent = db.project_events
const ProjectComment = db.project_event_comments
const Project = db.projects
const Container = db.containers
const Item = db.items
const Event = db.events
const User = db.users

router.use((req, res, next) => {
    passport.authenticate('jwt', { session: false })(req, res, next)
})

// Fetch worker submission requests
router.get('/fetch', async (req, res) => {
    const worker_id = parseInt(req.query.worker_id)

    try {
        const submissionrequests = await SubmissionRequestRecipient.findAll({
            attributes: ['worker_id'],
            include: [
                {
                    model: SubmissionRequest,
                    attributes: ['id', 'project_id', 'container_id', 'event_type', 'createdAt', 'is_viewed', 'is_submitted'],
                    include: [
                        {
                            model: Project,
                            attributes: ['name', 'is_completed'],
                        },
                        {
                            model: Container,
                            attributes: ['id', ['containerID', 'name']],
                        },
                        {
                            model: Item,
                            attributes: ['id', ['itemID', 'name']],
                        },
                        {
                            model: Event,
                            attributes: ['id', 'name'],
                        },
                        {
                            model: User,
                            attributes: ['id', 'organization_id'],
                        },
                        {
                            model: SubmissionRequestParticipants,
                            attributes: ['participant_id'],
                        },
                        {
                            model: SubmissionRequestDocumentParticipant,
                            attributes: ['participant_id'],
                        },
                        {
                            model: ProjectEvent,
                            attributes: ['id', 'image_url'],
                            include: [
                                {
                                    model: ProjectComment,
                                    attributes: ['comment'],
                                    order: [['id', 'ASC']],
                                    limit: 1,
                                },
                            ],
                        },
                    ],
                },
            ],
            where: {
                worker_id,
            },
            order: [['id', 'DESC']],
        })
        res.status(200).json({
            code: 1,
            message: string.apiResponses.submissionRequestFetchedSucess,
            data: submissionrequests,
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// update submission request on view
router.post('/view', (req, res) => {
    const request_id = parseInt(req.body.id)

    try {
        return SubmissionRequest.update(
            {
                is_viewed: 1,
            },
            {
                where: { id: request_id },
            },
        ).then((record) => {
            res.status(200).json({
                code: 1,
                message: string.apiResponses.submissionRequestViewedSucess,
                data: record,
            })
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Add Project Event
router.post('/add', multipartMiddleware, async (req, res) => {
    try {
        // Add Event
        const response = await ProjectEventHelper._addProjectEvent(req)

        // Change status of submission request
        await SubmissionRequest.update(
            {
                is_submitted: 1,
                project_event_id: response.id,
            },
            {
                where: { id: parseInt(req.body.submission_id) },
            },
        )

        // Update submission recipient
        await SubmissionRequestRecipient.update(
            {
                is_submitted: 1,
            },
            {
                where: {
                    worker_id: parseInt(req.body.worker_id),
                    submission_id: parseInt(req.body.submission_id),
                },
            },
        )

        res.status(200).json({
            code: 1,
            message: string.apiResponses.eventAddedSuccess,
            data: response,
            request_body: req.body,
            request_files: req.files,
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

module.exports = router
