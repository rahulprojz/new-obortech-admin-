// Load dependencies
const express = require('express');
const md5 = require('md5');
const string = require('../helpers/LanguageHelper');

// Load MySQL Models
const db = require("../models");
const Participant = db.participants;
const ParticipantCategory = db.participant_categories;
const Op = db.Sequelize.Op;

// Define global variables
const router = express.Router();

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried });
        return;
    }
    next();
});

// Fetch Participants code
router.get('/fetch', async (req, res) => {
    try {
        const participants = await Participant.findAll({
            include: [ParticipantCategory]
        });
        res.json(participants);
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

// Add Participant code
router.post('/add', (req, res) => {
    try {
        return Participant.create({
            participant_category_id: req.body.participant_category_id,
            password: req.body.password,
            username: req.body.username,
        }).then(function (participant) {
            if (participant) {
                res.json(participant);
            } else {
                res.json({ error: string.statusResponses.insertRecordErr });
            }
        });
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

// Update Participant code
router.post('/update', (req, res) => {
    try {
        return Participant.update(
            req.body,
            { where: { id: req.body.id } }
        )
            .then(record => {
                res.json(record);
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

// Remove Participant code
router.post('/remove', (req, res) => {
    try {
        return Participant.destroy({
            where: { id: req.body.id }
        })
            .then(record => {
                res.json(record);
            });
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

module.exports = router;
