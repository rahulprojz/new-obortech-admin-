// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')
const Invitation = db.invitation

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch Invitations
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const list = limit
            ? await Invitation.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            })
            : await Invitation.findAll()
        res.json(list)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
