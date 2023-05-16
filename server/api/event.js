const express = require('express')
const string = require('../helpers/LanguageHelper')
const networkHooks = require('../hooks/network-hooks')
const db = require('../models')

const Event = db.events
const EventCategory = db.event_categories
const DocumentCategory = db.document_categories
const { Op } = db.Sequelize
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch all events
router.post('/fetch', async (req, res) => {
    try {
        const events = await Event.findAll()
        res.json(events)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/isvalid-event-name', async (req, res) => {
    try {
        const { eventName, type } = req.body
        const eventCount = await Event.count({ where: { eventName, eventType: { [Op.in]: [type, 'alert'] } } })
        if (eventCount > 0) {
            return res.json({ isvalid: false })
        }
        return res.json({ isvalid: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch alert events
router.get('/fetch-alert-events', async (req, res) => {
    try {
        const alertEvents = await Event.findAll({ where: { eventType: 'alert' } })
        res.json(alertEvents)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch selected category events
router.post('/fetch-category-events', async (req, res) => {
    try {
        const { documentCategoryIds, eventCategoryIds } = req.body
        const eventCategory = await EventCategory.findAll({
            include: [{ model: Event, where: { eventType: 'event' } }],
            where: {
                id: { [Op.in]: eventCategoryIds },
            },
        })

        const documentCategory = await DocumentCategory.findAll({
            include: [{ model: Event, where: { eventType: 'document' } }],
            where: {
                id: { [Op.in]: documentCategoryIds },
            },
        })

        res.json({ eventCategory, documentCategory })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Event code
router.post('/add', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi('events', 'POST', req.body, 'AWS')
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Event code
router.post('/update', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi(`events/${req.body.eventObj.uniqId}`, 'PATCH', req.body, 'AWS')
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Event code
router.post('/remove', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi(`events/${req.body.uniqueId}`, 'DELETE', req.body, 'AWS')
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
