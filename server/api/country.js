// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const db = require('../models')
const Country = db.countries
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

// Get all counties - /api/v1/countries/
router.get('', async (req, res) => {
    try {
        const response = await Country.findAll({ attributes: ['id', 'code', 'name'], order: [['name', 'ASC']] })
        if (response.length > 0) {
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get county by Id - /api/v1/countries/id
router.get('/:id', async (req, res) => {
    const id = req.params.id
    try {
        const response = await Country.findOne({ attributes: ['id', 'code', 'name'], where: { id } })
        if (response.dataValues) {
            res.status(200).json({ code: statusCode.successData.code, data: response.dataValues, message: statusCode.successData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
