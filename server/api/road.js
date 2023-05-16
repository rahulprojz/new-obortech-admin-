// Load dependencies
const express = require('express')
const NodeGeocoder = require('node-geocoder')
const string = require('../helpers/LanguageHelper')

const options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GOOGLE_API_KEY,
}

const geocoder = NodeGeocoder(options)

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
        const stations = limit
            ? await Station.findAndCountAll({
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await Station.findAll()
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

// Get latitude and longtitude from address
router.post('/get-lat-long', async (req, res) => {
    geocoder
        .geocode(req.body.address)
        .then((result) => {
            res.json(result[0])
        })
        .catch((error) => res.status(400).json({ error: error.toString() }))
})

// Get address from latitude and longtitude
router.post('/get-address', async (req, res) => {
    geocoder
        .reverse(req.body.latLong)
        .then((result) => {
            res.json(result[0])
        })
        .catch((error) => res.status(400).json({ error: error.toString() }))
})

module.exports = router
