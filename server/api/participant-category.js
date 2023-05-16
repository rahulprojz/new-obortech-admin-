// Load dependencies
const express = require('express')
const md5 = require('md5')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const ParticipantCategory = db.participant_categories
const OrganizationCategories = db.organization_categories
const Organizations = db.organizations
const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

// Fetch ParticipantCategory code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const participantcategories = limit
            ? await ParticipantCategory.findAndCountAll({
                  where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await ParticipantCategory.findAll()
        res.json(participantcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch All ParticipantCategory code
router.get('/fetch-all', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const participantcategories = await ParticipantCategory.findAll({ 
            attributes: ['name', 'id'],
            where:{
                organization_id: req.user.organization_id
            } })
        res.json(participantcategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Add ParticipantCategory code
router.post('/add', (req, res) => {
    try {
        return ParticipantCategory.create({
            name: req.body.name,
            organization_id: req.user.organization_id,
        }).then(function (participant) {
            if (participant) {
                res.json(participant)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update ParticipantCategory code
router.post('/update', (req, res) => {
    try {
        return ParticipantCategory.update(req.body, {
            where: { id: req.body.id },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove ParticipantCategory code
router.post('/remove', async (req, res) => {
    const { id } = req.body
    try {
        const participant = await OrganizationCategories.findAll({
            include: [Organizations],
            where: {
                category_id: id,
            },
        })
        if (participant.length) {
            res.json({ participant, isDeleted: false })
        } else {
            await ParticipantCategory.destroy({
                where: { id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
    }
})

module.exports = router
