// Load dependencies
const express = require('express')
// const { validate } = require('express-validation')
const string = require('../helpers/LanguageHelper')
// const { checkIntegrity } = require('../validations/integrity-checker')
const IntegrityChecker = require('../services/integrityCheckerService')
// Load MySQL Models

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
// router.post('/check-integrity', validate(checkIntegrity), async (req, res) => {
router.post('/check-integrity',  async (req, res) => {
    try {
        const { type, uniqId, pdc } = req.body
        const integrity = new IntegrityChecker(type, uniqId, pdc, req.user, res)
        const data = await integrity.fetchIntegrityData()
        res.json(data)
    } catch (err) {
        res.status(400).json({ error: err.message || err.toString() })
    }
})

module.exports = router
