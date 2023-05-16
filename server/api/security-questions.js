const express = require('express')

const db = require('../models')

// Load MySQL Models
const SecurityQuestions = db.security_questions
const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

// Get security questions
router.get('/fetch', async (req, res) => {
    try {
        // const questionIds = []
        // for (let i = 0; i < 3; i++) {
        //     let number
        //     let isAlreadyExist
        //     do {
        //         number = Math.floor(Math.random() * 15) + 1
        //         isAlreadyExist = questionIds.includes(number)
        //         if (!isAlreadyExist) {
        //             questionIds.push(number)
        //         }
        //     }
        //     while(isAlreadyExist)
        // }
        const securityQuestions = await SecurityQuestions.findAll({
            attributes: ['id', 'questions', 'local_questions'],
            // order: [[db.Sequelize.literal(`id=${questionIds[2]}, id=${questionIds[1]}, id=${questionIds[0]}`)]],
            // where: {
            //     id: { [Op.in]: questionIds },
            // },
        })
        res.json(securityQuestions || [])
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
