// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const db = require('../models')
const City = db.cities
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

// Get all cities on country code - /api/v1/cities
router.get('', async (req, res) => {
    const state_id = req.query.code || '5089' //Default will be Ulanbataar
    try {
        const response = await City.findAll({ attributes: ['id', 'name'], where: { state_id } })
        if (response.length > 0) {
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get City by Id - /api/v1/cities/id
router.get('/:id', async (req, res) => {
    const id = req.params.id || '5089' //Default will be Ulanbataar
    try {
        const response = await City.findOne({ attributes: ['id', 'name'], where: { id } })
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
