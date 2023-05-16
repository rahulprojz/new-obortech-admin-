// Load dependencies
const express = require('express')
const axios = require('axios')
const string = require('../helpers/language-helper')
const db = require('../models')
const Languages = db.languages
const _ = require('lodash')
const router = express.Router()

// router.use((req, res, next) => {
//     if (!req.user) {
//         res.status(401).json({ error: string.statusResponses.unAuthoried })
//         return
//     }
//     next()
// })

// Fetch Language code
router.get('/fetch', async (req, res) => {
    try {
        const languages = await Languages.findAll()
        res.json(languages)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch Language code
router.get('/fetch/:lid', async (req, res) => {
    try {
        const { lid } = req.params
        const language = await Languages.findOne({ where: { id: lid } })
        const headers = {
            'Content-Type': 'application/json',
        }
        if (language && language.name) {
            const adminResponse = await axios.get(`https://api.locize.app/06f0832d-06af-47f5-bb29-62a90f65f2e6/latest/${language.code.toLowerCase()}/admin`, headers)
            const SmartContractResponse = await axios.get(`https://api.locize.app/06f0832d-06af-47f5-bb29-62a90f65f2e6/latest/${language.code.toLowerCase()}/Smart+contract+and+others`, headers)
            const languageJson = _.merge(adminResponse.data, SmartContractResponse.data)
            if (languageJson) {
                await Languages.update({ json: languageJson }, { where: { id: lid } })
                return res.json({ json: languageJson })
            }
        }
        res.json({ json: false })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch Language json
router.get('/:code', (req, res) => {
    try {
        return Languages.findOne({ where: { code: req.params.code.toLowerCase() }, attributes: ['json'] })
            .then((language) => {
                if (language && language.json) {
                    res.json({ json: language.json })
                } else {
                    res.json(false)
                }
            })
            .catch((err) => {
                res.json({ error: err.message || err.toString() })
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
