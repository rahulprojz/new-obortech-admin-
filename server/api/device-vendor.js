// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')
const DeviceVendor = db.device_vendors
const Device = db.devices
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

// Fetch device vendors
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const devicevendors = limit
            ? await DeviceVendor.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            })
            : await DeviceVendor.findAll()
        res.json(devicevendors)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add device vendor
router.post('/add', async (req, res) => {
    try {
        return DeviceVendor.create({
            name: req.body.name,
            api_key: req.body.api_key,
            organization_id: req.user.organization_id,
        }).then(function (devicevendor) {
            if (devicevendor) {
                res.json(devicevendor)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update device vendor
router.post('/update', async (req, res) => {
    try {
        return DeviceVendor.update(req.body, { where: { id: req.body.id } }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove device vendor
router.post('/remove', async (req, res) => {
    try {
        const device = await Device.findOne({
            where: {
                vendor_id: req.body.id,
            },
        })
        if (device) {
            res.json({ isDeleted: false })
        } else {
            await DeviceVendor.destroy({
                where: { id: req.body.id },
            })
            res.json({ isDeleted: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
