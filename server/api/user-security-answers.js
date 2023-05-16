const express = require('express')

const db = require('../models')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const UserSecurityAnswers = db.user_security_answers
const SecurityQuestions = db.security_questions
const users = db.users

// Define global variables
const router = express.Router()

// Add user security answers
router.post('/add', async (req, res) => {
    try {
        await UserSecurityAnswers.bulkCreate(req.body)

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Get random user security answers by user
router.post('/fetch', async (req, res) => {
    try {
        let whereObj = {}
        if (req.user && req.user.id) {
            whereObj = { id: req.user.id }
        } else {
            whereObj = { email: req.body.email }
        }
        const userData = await users.findOne({
            where: whereObj,
            include: [
                {
                    model: UserSecurityAnswers,
                    include: [
                        {
                            model: SecurityQuestions,
                        },
                    ],
                },
            ],
        })
        const userSecurityAnswers = userData.user_security_answers
        const index = req.body.index
        res.json(userSecurityAnswers[index] || {})
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
