// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const DocumentCategory = db.document_categories
const ProjectCategory = db.project_categories
const Events = db.events
const ProjectDocumentCategory = db.project_document_categories
const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

/*
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})
*/

// Fetch Document Categories
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const documentcategories = limit
            ? await DocumentCategory.findAndCountAll({
                where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await DocumentCategory.findAll()
        res.json(documentcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch DOcumentCategory code
router.post('/fetch-document-by-pdc', async (req, res) => {
    try {
        const { project_category_id } = req.body

        const documentcategories = await ProjectDocumentCategory.findAll({
            include: [
                {
                    model: DocumentCategory,
                },
            ],
            where: {
                project_category_id,
            },
        })
        res.json(documentcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All Document Categories
router.get('/fetch-all', async (req, res) => {
    try {
        const documentcategories = await DocumentCategory.findAll({ 
            attributes: ['name', 'id'],
            where:{
                organization_id: req.user.organization_id
            } })
        res.json(documentcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add DocumentCategory code
router.post('/add', (req, res) => {
    try {
        return DocumentCategory.create({
            name: req.body.name,
            organization_id: req.user.organization_id,
        }).then(function (document) {
            if (document) {
                res.json(document)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update DocumentCategory code
router.post('/update', (req, res) => {
    try {
        return DocumentCategory.update(req.body, { where: { id: req.body.id } }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove DocumentCategory code
router.post('/remove', async (req, res) => {
    const { id } = req.body
    try {
        const document = await ProjectDocumentCategory.findAll({
            include: [ProjectCategory],
            where: {
                document_category_id: id,
            },
        })
        if (document.length) {
            res.json({ document, isDeleted: false })
        } else {
            await DocumentCategory.destroy({
                where: { id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All the Events for all the Documentcategory
router.get('/fetch-with-events', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            where :{ organization_id: req.user.organization_id },
            include: [
                {
                    model: Events,
                },
            ],
            order: [
                ['id', 'ASC'],
                [db.events, 'id', 'ASC'],
            ],
       }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
        }
        const categories = limit ? await DocumentCategory.findAndCountAll(filter) : await DocumentCategory.findAll(filter)
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
