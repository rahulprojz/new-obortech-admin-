// Load dependencies
const express = require('express');

// Load MySQL Models
const db = require("../models");
const Country = db.countries;
const State = db.states;
const City = db.cities;
const Op = db.Sequelize.Op;

// Define global variables
const router = express.Router();

// Get all counties - /api/v1/country/
router.get('/', async (req, res) => {
    const attributes = { attributes: ['id', 'sortname', 'name', 'phonecode']}
    try{
        const response = await Country.findAll(attributes)
        if (response.length > 0){
            res.status(200).json({ code: statusCode.successData.code, data: response, message: statusCode.successData.message });
        }else {
            res.status(400).json(statusCode.emptyData);
        }
        // res.json(countries);
    }catch(error){
        res.json({ error: err.message || err.toString() });
    }
});

module.exports = router;