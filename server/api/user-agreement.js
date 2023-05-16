const express = require('express')

const db = require('../models')
const statusCode = require('../../utils/statusCodes')
const userHelper = require('../helpers/user-helper')

// Load MySQL Models
const UserAgreement = db.user_agreement

// Define global variables
const router = express.Router()

// Get user agreement by user
router.get('/fetch', async (req, res) => {
    try {
        const userAgreement = await UserAgreement.findOne({ where: { user_id: req.user.id } })
        res.json(userAgreement || {})
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get user agreement hash by user
router.get('/getHash', async (req, res) => {
    try {
        const userAgreement = await UserAgreement.findOne({ where: { user_id: req.user.id } })        
        //const uniqueId = await userHelper.getUserUniqId(userAgreementHash.user_id)
        res.json(userAgreement || {})
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add user agreement by user
router.post('/add', async (req, res) => {
    try {
        const { agreement, file_hash, user_id } = req.body
        
        await UserAgreement.create({ agreement, file_hash, user_id })

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
