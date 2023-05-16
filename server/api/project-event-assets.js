// Load dependencies
const express = require('express')

// Load MySQL Models
const db = require('../models')

const ProjectEventAssets = db.project_event_assets

const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        let filter = {}
        if (limit) {
            filter = { limit: parseInt(limit), offset: parseInt(offset), order: [['createdAt', 'DESC']] }
        }
        const response = limit ? await ProjectEventAssets.findAndCountAll(filter) : await ProjectEventAssets.findAll()
        res.json(response)
    } catch (err) {
        console.log(err)
    }
})

module.exports = router
