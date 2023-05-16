const express = require('express')
const fs = require('fs')
const string = require('../helpers/LanguageHelper')
const db = require('../models')

const EventCategory = db.event_categories
const Events = db.events
const EventTranslations = db.event_translations
const ProjectCategory = db.project_categories
const ProjectEventCategory = db.project_event_categories
const router = express.Router()
const { Op } = db.Sequelize

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch EventCategory code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const eventcategories = limit
            ? await EventCategory.findAndCountAll({
                  where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await EventCategory.findAll()
        res.json(eventcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch EventCategory code
router.post('/fetch-event-by-pdc', async (req, res) => {
    try {
        const { project_category_id } = req.body
        const eventcategories = await ProjectEventCategory.findAll({
            include: [
                {
                    model: EventCategory,
                },
            ],
            where: {
                project_category_id,
            },
        })
        res.json(eventcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All EventCategory code
router.get('/fetch-all', async (req, res) => {
    try {
        const eventcategories = await EventCategory.findAll({ 
            attributes: ['name', 'id'],
            where:{
                organization_id: req.user.organization_id
            } })
        res.json(eventcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add EventCategory code
router.post('/add', async (req, res) => {
    try {
        const event = await EventCategory.create({
            name: req.body.name,
            organization_id: req.user.organization_id,

        })
        if (event) {
            res.json(event)
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update EventCategory code
router.post('/update', async (req, res) => {
    try {
        const record = await EventCategory.update(req.body, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove EventCategory code
router.post('/remove', async (req, res) => {
    const { id } = req.body
    try {
        const event = await ProjectEventCategory.findAll({
            include: [ProjectCategory],
            where: {
                event_category_id: id,
            },
        })
        if (event.length) {
            res.json({ event, isDeleted: false })
        } else {
            await EventCategory.destroy({
                where: { id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All the Events for all the Eventcategory
router.get('/fetch-with-events', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            where : { organization_id: req.user.organization_id },
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
        const categories = limit ? await EventCategory.findAndCountAll(filter) : await EventCategory.findAll(filter)
        res.json(categories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
