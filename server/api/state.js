// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const db = require('../models')
const State = db.states
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

// Get all cities on country code - /api/v1/cities
router.get('', async (req, res) => {
    const country_id = req.query.code || '146' //Default country will be Mongolia
    try {
        const response = await State.findAll({ attributes: ['id', 'name'], where: { country_id } })
        if (response.length > 0) {
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
