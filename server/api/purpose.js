// Load dependencies
const express = require('express')

// Load MySQL Models
const db = require('../models')
const RequestPurpose = db.requestpurpose

// Define global variables
const router = express.Router()

// Fetch Request Purpose
router.get('/', async (req, res) => {
    try {
        const fetchpurpose = await RequestPurpose.findAll()
        res.json(fetchpurpose)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
