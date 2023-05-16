// Load dependencies
const express = require('express');
const statusCode = require('../../utils/statusCodes');

// Load MySQL Models
const db = require("../models");
const Role = db.roles;

// Define global variables
const router = express.Router();

// Add New Role - /api/v1/role
router.post('/', async (req, res) => {
    try {
        const response = await Role.create({
            name: req.body.name,
        });
        if (response && response.dataValues ){
            res.status(201).json({ code: statusCode.createdData.code, data: response, message: statusCode.createdData.message });
        }else {
            res.status(400).json(statusCode.emptyData);
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

// List all Roles - /api/v1/role/
router.get('/', async (req, res) => {
    try {
        const response = await Role.findAll();
        if (response.length > 0){
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message });
        }else {
            res.status(400).json(statusCode.emptyData);
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

module.exports = router;
