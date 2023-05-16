// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const Truck = db.trucks
const SelectionTrucks = db.selection_trucks
const ProjectSelections = db.project_selections
const { projects } = db
const { Op } = db.Sequelize
const { sequelize } = db

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch Trucks code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const trucks = limit
            ? await Truck.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
            })
            : await Truck.findAll({ where })
        res.json(trucks)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Truck code
router.post('/add', async (req, res) => {
    try {
        const checkTruckExists = await Truck.findAll({
            where: {
                truckID: sequelize.where(sequelize.fn('LOWER', sequelize.col('truckID')), req.body.truckID.toLowerCase()),
                organization_id: req.user.organization_id
            },
        })
        if (checkTruckExists.length > 0) {
            return res.json({ truckAlreadyExists: true })
        }
        return Truck.create({
            truckID: req.body.truckID,
            organization_id: req.user.organization_id,
        }).then(function (truck) {
            if (truck) {
                res.json(truck)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Truck code
router.post('/update', async (req, res) => {
    try {
        const checkTruckExists = await Truck.findAll({
            where: {
                truckID: sequelize.where(sequelize.fn('LOWER', sequelize.col('truckID')), req.body.truckID.toLowerCase()),
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkTruckExists.length > 0) {
            return res.json({ truckAlreadyExists: true })
        }
        return Truck.update(req.body, { where: { id: req.body.id } }).then((truck) => {
            if (truck) {
                res.json({ status: true })
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Truck code
router.post('/remove', async (req, res) => {
    try {
        const isAvailable = await SelectionTrucks.count({ where: { truck_id: req.body.id } })
        if (!isAvailable) {
            return Truck.destroy({
                where: { id: req.body.id },
            }).then((record) => {
                res.json({ success: true })
            })
        }
        res.json({ success: false })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch truck's project
router.post('/fetch-truck-project', async (req, res) => {
    try {
        const { truck_id } = req.body
        const projectDetails = await SelectionTrucks.findOne({
            where: { truck_id },
            include: [
                { model: Truck },
                {
                    model: ProjectSelections,
                    include: [
                        {
                            model: projects,
                        },
                    ],
                },
            ],
        })
        res.json(projectDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
