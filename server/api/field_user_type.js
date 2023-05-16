// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const db = require('../models')
const FieldUserType = db.field_user_types

// Define global variables
const router = express.Router()

// Add New Type - /api/v1/types
router.post('/', async (req, res) => {
    try {
        const response = await FieldUserType.create({
            name: req.body.name,
        })
        if (response && response.dataValues) {
            res.status(201).json({ code: statusCode.createdData.code, data: response, message: statusCode.createdData.message })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// List all Types - /api/v1/types/
router.get('/', async (req, res) => {
    try {
        const response = await FieldUserType.findAll()
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
