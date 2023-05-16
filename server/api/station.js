// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')
const Station = db.stations
const ProjectRoad = db.project_roads
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

// Fetch Roads code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const stations = limit
            ? await Station.findAndCountAll({
                  where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await Station.findAll({ where })
        res.json(stations)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Road code
router.post('/add', (req, res) => {
    try {
        return Station.create({
            name: req.body.name,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            radius: req.body.radius,
            organization_id: req.user.organization_id,
        }).then(function (station) {
            if (station) {
                res.json(station)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Road code
router.post('/update', (req, res) => {
    try {
        return Station.update(req.body, { where: { id: req.body.id } }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Road code
router.post('/remove', async (req, res) => {
    try {
        const projectRoad = await ProjectRoad.findOne({
            where: {
                road_id: req.body.id,
            },
        })
        if (projectRoad) {
            res.json({ isDeleted: false })
        } else {
            await Station.destroy({
                where: { id: req.body.id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
