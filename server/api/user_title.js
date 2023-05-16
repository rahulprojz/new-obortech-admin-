// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')
const UserTitles = db.user_titles
const sequelize = db.sequelize
const User = db.users
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

// Add New user title
router.post('/add', async (req, res) => {
    try {
        const checkTitleExists = await UserTitles.findAll({
            where: {
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), req.body.name.toLowerCase()),
            },
        })
        if (checkTitleExists.length > 0) {
            return res.json({ titleAlreadyExists: true })
        } else {
            const response = await UserTitles.create({
                name: req.body.name,
            })
            if (response && response.dataValues) {
                res.status(201).json({ code: statusCode.createdData.code, data: response, message: statusCode.createdData.message })
            } else {
                res.status(400).json(statusCode.emptyData)
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update User title
router.post('/update', async (req, res) => {
    try {
        const checkTitleExists = await UserTitles.findAll({
            where: {
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), req.body.name.toLowerCase()),
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkTitleExists.length > 0) {
            return res.json({ titleAlreadyExists: true })
        } else {
            const response = await UserTitles.update(req.body, { where: { id: req.body.id } })
            if (response) {
                res.json({ status: true })
            } else {
                res.json({ error: string.statusResponses.updateRecordErr })
            }
        }
    } catch (error) {
        res.json({ error: err.message || err.toString() })
    }
})

// List all user titles
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const response = limit
            ? await UserTitles.findAndCountAll({
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await UserTitles.findAll()
        const isValid = !!(response && (limit ? response.rows && response.rows.length : response.length))
        if (isValid) {
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove user title code
router.post('/remove', async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                title_id: req.body.id,
            },
        })
        if (user) {
            res.json({ status: false })
        } else {
            await UserTitles.destroy({
                where: { id: req.body.id },
            })
            res.json({ status: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
