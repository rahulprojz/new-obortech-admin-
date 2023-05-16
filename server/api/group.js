// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const Group = db.groups
const SelectionGroups = db.selection_groups
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

// Fetch Groups code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const where = { organization_id: req.user.organization_id }
        const groups = limit
            ? await Group.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
            })
            : await Group.findAll()
        res.json(groups)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Group code
router.post('/add', async (req, res) => {
    try {
        const checkGroupExists = await Group.findAll({
            where: {
                groupID: sequelize.where(sequelize.fn('LOWER', sequelize.col('groupID')), req.body.groupID.toLowerCase()),
            },
        })
        if (checkGroupExists.length > 0) {
            return res.json({ groupAlreadyExists: true })
        }
        return Group.create({
            groupID: req.body.groupID,
            organization_id: req.user.organization_id
        }).then(function (group) {
            if (group) {
                res.json(group)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Group code
router.post('/update', async (req, res) => {
    try {
        const checkGroupExists = await Group.findAll({
            where: {
                groupID: sequelize.where(sequelize.fn('LOWER', sequelize.col('groupID')), req.body.groupID.toLowerCase()),
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkGroupExists.length > 0) {
            return res.json({ groupAlreadyExists: true })
        }
        return Group.update(req.body, { where: { id: req.body.id } }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Group code
router.post('/remove', async (req, res) => {
    try {
        const isAvailable = await SelectionGroups.count({ where: { group_id: req.body.id } })
        if (!isAvailable) {
            return Group.destroy({
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

// Fetch group's project
router.post('/fetch-group-project', async (req, res) => {
    try {
        const { group_id } = req.body
        const projectDetails = await SelectionGroups.findOne({
            where: { group_id },
            include: [
                {
                    model: Group,
                },
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
