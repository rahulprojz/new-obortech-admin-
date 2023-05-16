// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')
const projectHelper = require('../helpers/project-helper')

const ProjectCategory = db.project_categories
const ProjectEventCategory = db.project_event_categories
const ProjectDocumentCategory = db.project_document_categories
const DocumentCategory = db.document_categories
const ProjectParticipantCategories = db.project_participant_categories
const ParticipantCategories = db.participant_categories
const EventCategory = db.event_categories
const Project = db.projects
const PdcCategories = db.project_pdc_categories
const PdcOrganizations = db.pdc_organizations
const PdcSelections = db.pdc_selections
const PdcOrgs = db.pdc_orgs
const PdcParticipants = db.pdc_participants
const OrganizationCategories = db.organization_categories
const ProjectPdcCategoryEvent = db.project_pdc_category_events
const Events = db.events

const ProjectEventCategories = db.project_event_categories
const EventCategories = db.event_categories
const ProjectDocumentCategories = db.project_document_categories
const DocumentCategories = db.document_categories
const { Op } = db.Sequelize
const Organizations = db.organizations

// Define global variables
const router = express.Router()

// Fetch document types
router.get('/fetchByProject/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params
        const project = await Project.findOne({
            where: { id: project_id },
            include: [
                {
                    model: ProjectCategory,
                    include: [
                        {
                            model: ProjectDocumentCategory,
                        },
                    ],
                },
            ],
        })
        // category id list
        const ids = []
        const categories = (project && project.project_category && project.project_category.project_document_categories) || []
        categories.forEach((cat) => {
            ids.push(cat.document_category_id)
        })
        const events = ids.length
            ? await Events.findAll({
                  where: {
                      event_category_id: { [Op.in]: ids },
                      eventType: 'document',
                  },
              })
            : []
        res.json(events)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch ProjectCategory
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            where: { organization_id: req.user.organization_id },
            include: [
                {
                    model: ProjectEventCategory,
                    attributes: ['id', 'project_category_id', 'event_category_id'],
                    include: [
                        {
                            model: EventCategory,
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: ProjectDocumentCategory,
                    attributes: ['id', 'project_category_id', 'document_category_id'],
                    include: [
                        {
                            model: DocumentCategory,
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: ProjectParticipantCategories,
                    attributes: ['id', 'project_category_id', 'participant_category_id'],
                    include: [
                        {
                            model: ParticipantCategories,
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: PdcCategories,
                    include: [
                        {
                            model: PdcOrganizations,
                        },
                        {
                            model: PdcSelections,
                        },
                        {
                            model: PdcOrgs,
                        },
                        {
                            model: PdcParticipants,
                        },
                        { model: ProjectPdcCategoryEvent },
                    ],
                },
            ],
            order: [
                ['id', 'ASC'],
                [db.project_pdc_categories, 'id', 'ASC'],
                [db.project_event_categories, 'id', 'ASC'],
                [db.project_document_categories, 'id', 'ASC'],
                [db.project_participant_categories, 'id', 'ASC'],
            ],
        }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
        }
        const categories = limit ? await ProjectCategory.findAndCountAll(filter) : await ProjectCategory.findAll(filter)
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch ProjectCategory which have organizations
router.get('/fetch-categories', async (req, res) => {
    try {
        const categories = await ProjectCategory.findAll({
            include: [
                {
                    model: ProjectParticipantCategories,
                    required: true,
                    attributes: ['id', 'participant_category_id'],
                    include: [
                        {
                            model: ParticipantCategories,
                            required: true,
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: OrganizationCategories,
                                    required: true,
                                    include: [
                                        {
                                            model: Organizations,
                                            attributes: ['id', 'name'],
                                            required: true,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        })
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch document types
router.get('/fetchPDC/:category_id', async (req, res) => {
    try {
        const { category_id } = req.params
        const project = await PdcCategories.findAll({
            where: { project_category_id: category_id },
        })
        res.json(project)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch ProjectEventCategory
router.post('/fetchProjectEventCategories', async (req, res) => {
    try {
        const { project_category_id } = req.body

        // Container ID Filter
        const where_condition = {}
        if (Array.isArray(project_category_id) && project_category_id.length > 0) {
            where_condition.project_category_id = { [Op.in]: project_category_id }
        } else {
            where_condition.project_category_id = project_category_id
        }

        const categories = await ProjectEventCategory.findAll({
            include: [
                {
                    model: EventCategory,
                },
            ],
            where: where_condition,
        })
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch ProjectDocumentCategory
router.post('/fetchProjectDocumentCategories', async (req, res) => {
    try {
        const { project_category_id } = req.body

        // Container ID Filter
        const where_condition = {}
        if (Array.isArray(project_category_id) && project_category_id.length > 0) {
            where_condition.project_category_id = { [Op.in]: project_category_id }
        } else {
            where_condition.project_category_id = project_category_id
        }

        const categories = await ProjectDocumentCategory.findAll({
            include: [
                {
                    model: DocumentCategory,
                },
            ],
            where: where_condition,
        })
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add ProjectCategory
router.post('/add', (req, res) => {
    try {
        return ProjectCategory.create({
            name: req.body.name,
            organization_id: req.user.organization_id,
        }).then(function (event) {
            if (event) {
                res.json(event)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add addProjectDocumentCategory
router.post('/addProjectDocumentCategory', async (req, res) => {
    try {
        const existingCategory = await ProjectDocumentCategory.findOne({
            where: {
                project_category_id: req.body.project_category_id,
                document_category_id: req.body.value,
            },
        })

        // Check if category already existing
        if (!existingCategory) {
            return ProjectDocumentCategory.create({
                project_category_id: req.body.project_category_id,
                document_category_id: req.body.value,
            }).then(function (category) {
                if (category) {
                    res.json({
                        code: 1,
                        data: {
                            category,
                        },
                    })
                } else {
                    res.json({
                        code: 2,
                        message: string.statusResponses.insertRecordErr,
                    })
                }
            })
        }
        res.json({
            code: 2,
            message: 'alrdyexisting',
        })
    } catch (err) {
        res.json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Add addProjectParticipantCategory
router.post('/addProjectparticipantCategory', async (req, res) => {
    try {
        const existingCategory = await ProjectParticipantCategories.findOne({
            where: {
                project_category_id: req.body.project_category_id,
                participant_category_id: req.body.value,
            },
        })

        // Check if category already existing
        if (!existingCategory) {
            return ProjectParticipantCategories.create({
                project_category_id: req.body.project_category_id,
                participant_category_id: req.body.value,
            }).then(async function (category) {
                if (category) {
                    await projectHelper.addProjectParticipants(req.body.value, req.body.project_category_id)
                    res.json({
                        code: 1,
                        data: {
                            category,
                        },
                    })
                } else {
                    res.json({
                        code: 2,
                        message: string.statusResponses.insertRecordErr,
                    })
                }
            })
        }
        res.json({
            code: 2,
            message: string.apiResponses.categoryExists,
        })
    } catch (err) {
        res.json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Add ProjectEventCategory
router.post('/addProjectEventCategory', async (req, res) => {
    try {
        const existingCategory = await ProjectEventCategory.findOne({
            where: {
                project_category_id: req.body.project_category_id,
                event_category_id: req.body.value,
            },
        })

        // Check if category already existing
        if (!existingCategory) {
            return ProjectEventCategory.create({
                project_category_id: req.body.project_category_id,
                event_category_id: req.body.value,
            }).then(function (category) {
                if (category) {
                    res.json({
                        code: 1,
                        data: {
                            category,
                        },
                    })
                } else {
                    res.json({
                        code: 2,
                        message: string.statusResponses.insertRecordErr,
                    })
                }
            })
        }
        res.json({
            code: 2,
            message: 'alrdyexisting',
        })
    } catch (err) {
        res.json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

// Update ProjectCategory
router.post('/update', (req, res) => {
    try {
        return ProjectCategory.update(req.body, {
            where: { id: req.body.id },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove ProjectCategory
router.post('/remove', async (req, res) => {
    try {
        const project = await Project.findAll({
            where: {
                project_category_id: req.body.id,
            },
        })
        if (project.length) {
            res.json({ project, isDeleted: false })
        } else {
            await ProjectCategory.destroy({
                where: { id: req.body.id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove removeProjectEventCategory
router.post('/removeProjectEventCategory', (req, res) => {
    try {
        return ProjectEventCategory.destroy({
            where: { id: req.body.id },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove removeProjectDocumentCategory
router.post('/removeProjectDocumentCategory', (req, res) => {
    try {
        return ProjectDocumentCategory.destroy({
            where: { id: req.body.id },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove removeProjectDocumentCategory
router.post('/removeProjectParticipantCategory', (req, res) => {
    try {
        return ProjectParticipantCategories.destroy({
            where: { id: req.body.id },
        }).then(async (record) => {
            await projectHelper.removeProjectParticipants(req.body.participant_category_id, req.body.project_category_id)
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get Events/Documents data by Project category
router.get('/fetch-event-document/:project_category_id', async (req, res) => {
    try {
        const { project_category_id } = req.params
        const eventsDocumentsCategory = await ProjectCategory.findOne({
            include: [
                {
                    model: ProjectEventCategories,
                    include: [{ model: EventCategories, include: [{ model: Events }] }],
                },
                {
                    model: ProjectDocumentCategories,
                    include: [{ model: DocumentCategories, include: [{ model: Events }] }],
                },
            ],
            where: { id: project_category_id },
        })
        res.json(eventsDocumentsCategory)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
