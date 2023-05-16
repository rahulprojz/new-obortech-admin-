// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const db = require('../models')

const TempNetwork = db.temp_network_events

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// get temp network
router.get('/fetch', async (req, res) => {
    try {
        const tempEvents = await TempNetwork.findAll()
        let result = []
        tempEvents.map((temp) => {
            Array.prototype.push.apply(temp, { event: JSON.parse(temp.event) })
        })
        res.json(result)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
