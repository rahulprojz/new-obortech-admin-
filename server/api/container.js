// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const ShortUniqueId = require('short-unique-id')

// Load MySQL Models
const db = require('../models')

const Container = db.containers
const Item = db.items
const SelectionContainers = db.selection_containers
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

// Fetch Containers code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const containers = limit
            ? await Container.findAndCountAll({
                  where,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await Container.findAll()
        res.json(containers)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch container code
router.post('/fetch-container', async (req, res) => {
    try {
        const { id } = req.body
        const container = await Container.findByPk(id)
        res.json(container)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Container code
router.post('/add', async (req, res) => {
    try {
        const checkContainerExists = await Container.findAll({
            where: {
                containerID: sequelize.where(sequelize.fn('LOWER', sequelize.col('containerID')), req.body.containerID.toLowerCase()),
            },
        })
        if (checkContainerExists.length > 0) {
            return res.json({ containerAlreadyExists: true })
        }
        const uniqueCode = new ShortUniqueId({ length: 30 })
        const unique_code = uniqueCode()
        return Container.create({
            containerID: req.body.containerID,
            organization_id: req.user.organization_id,
            unique_code,
            manual_code: req.body.manualCode,
        }).then(function (container) {
            if (container) {
                res.json(container)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Container code
router.post('/update', async (req, res) => {
    try {
        const checkContainerExists = await Container.findAll({
            where: {
                containerID: sequelize.where(sequelize.fn('LOWER', sequelize.col('containerID')), req.body.containerID.toLowerCase()),
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkContainerExists.length > 0) {
            return res.json({ containerAlreadyExists: true })
        }
        return Container.update(req.body, { where: { id: req.body.id } }).then((container) => {
            if (container) {
                res.json({ status: true })
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Container code
router.post('/remove', async (req, res) => {
    try {
        const isAvailable = await SelectionContainers.count({ where: { container_id: req.body.id } })
        if (!isAvailable) {
            return Container.destroy({
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

// Fetch container's project
router.post('/fetch-container-project', async (req, res) => {
    try {
        const { container_id } = req.body
        const projectDetails = await SelectionContainers.findOne({
            where: { container_id },
            include: [
                {
                    model: ProjectSelections,
                    include: [
                        {
                            model: projects,
                        },
                    ],
                },
                {
                    model: Container,
                },
            ],
        })
        res.json(projectDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/check-manual-code', async (req, res) => {
    try {
        const { manual_code } = req.body
        const existingQrCode = await Container.count({ where: { manual_code } })
        const existingInItem = await Item.count({ where: { qr_code: manual_code } })
        if (existingQrCode || existingInItem) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
