// Load dependencies
const express = require('express')
const md5 = require('md5')
const string = require('../helpers/LanguageHelper')

const otpHelper = require('../helpers/otp-helper.js')

// Load MySQL Models
const db = require('../models')
const Op = db.Sequelize.Op
const Worker = db.workers

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Add Worker Code
router.post('/add', async (req, res) => {
    try {
        const userName = req.body.user.toLowerCase()
        const currentTimeStamp = Date.now().toString().slice(-4)
        const uniqueId = userName.substring(0, 3) + currentTimeStamp

        const roleId = req.body.role_id
        const isActive = req.body.is_active

        //Check if Email already exists
        const checkEmailExists = await Worker.findAll({
            where: {
                email: req.body.email.toLowerCase(),
            },
        })
        if (checkEmailExists.length > 0 && req.body.email) {
            return res.json({ emailAlreadyExists: true })
        }

        //Check if Email already exists
        const checkMobileExists = await Worker.findAll({
            where: {
                phone: req.body.phone,
            },
        })
        if (checkMobileExists.length > 0) {
            return res.json({ mobileAlreadyExists: true })
        }

        //Send SMS to worker to download APP
        if (req.body.phone) {
            const smsResponse = await sendVerificationSms(req.body.phone, req.body.country_code,req.body.otp)
            if (smsResponse.code != 1) {
                res.json({ error: smsResponse.message })
                return false
            }
        }

        const worker = await Worker.create({
            user_id: req.body.user_id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            email: req.body.email.toLowerCase(),
            role_id: parseInt(roleId),
            username: uniqueId.replace(/\s+/g, '').toUpperCase(),
            isActive: parseInt(isActive),
            country_code: req.body.country_code,
            otp: req.body.otp,
        })
        res.json(worker)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch Workers code
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = { order: [['id', 'DESC']] }
        if (limit) {
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
        }
        const workers = limit
            ? await Worker.findAndCountAll(filter)
            : await Worker.findAll(filter)
        res.json(workers)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Worker code

router.post('/update', async (req, res) => {
    try {
        //Check if Email already exists
        const checkEmailExists = await Worker.findAll({
            where: {
                email: req.body.email.toLowerCase(),
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkEmailExists.length > 0 && req.body.email) {
            return res.json({ emailAlreadyExists: true })
        }

        //Check if Email already exists
        const checkMobileExists = await Worker.findAll({
            where: {
                phone: req.body.phone,
                id: { [Op.notIn]: [req.body.id] },
            },
        })
        if (checkMobileExists.length > 0) {
            return res.json({ mobileAlreadyExists: true })
        }

        const worker = await Worker.update(req.body, {
            where: { id: req.body.id },
        })
        res.json({ status: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Worker code

router.post('/remove', async (req, res) => {
    try {
        return await Worker.destroy({
            where: { id: req.body.id },
        }).then((record) => {
            res.json({ status: true })
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

const sendVerificationSms = async (phone_number, country_code,verificationCode) => {
    try {
        let response
        const message = 'You are added as Field user on Obortech. You can download our app from https://obortech.s3.ap-southeast-1.amazonaws.com/apps/android.apk'
        const smsResponce = await otpHelper._sendVerificationMsg(message, country_code, phone_number,verificationCode)
        if (smsResponce.success) {
            response = {
                code: 1,
                message: string.apiResponses.smsSentSuccess,
            }
        } else {
            response = {
                code: 2,
                message: smsResponce.message,
            }
        }
        return response
    } catch (err) {
        response = {
            code: 2,
            message: err.message || err.toString(),
        }
        return response
    }
}

router.get('/fetch/verified', async (req, res) => {
    try {
        let workers = []
        workers = await Worker.findAll({
            attributes: ['first_name', 'last_name', 'id'],
            where: {
                isActive: 1,
                is_verified: 1,
            },
        })

        res.json(workers)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
