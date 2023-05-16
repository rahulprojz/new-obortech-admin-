// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
// Load MySQL Models
const db = require('../models')
const APIKey = db.apikey
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch Credentials
router.get('/fetch', async (req, res) => {
    try {
        const apikey = await APIKey.findOne({ type: 'apikey' })
        res.json(apikey)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Credentials
router.post('/save', (req, res) => {
    try {
        return APIKey.update(
            {
                value: req.body.value,
            },
            { where: { type: 'apikey' } },
        ).then(function (data) {
            if (data) {
                res.json(data)
            } else {
                res.json({ error: string.statusResponses.savingRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
