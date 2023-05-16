// Load dependencies
const express = require('express')
const networkHooks = require('../hooks/network-hooks')

// Define global variables
// const logger = require('../logs')
const router = express.Router()
const db = require('../models')
const User = db.users
const Organization = db.organizations

router.post('/authVerifyStepOne', async (req, res) => {
    try {
        // Get user organization
        const userData = await User.findOne({
            attributes: {
                exclude: ['password'],
            },
            include: [{ model: Organization, attributes: ['name'], required: true, where: { isDeleted: 0 } }],
            where: {
                username: req.body.username,
                isDeleted: 0,
            },
        })
        if (!userData) {
            return res.json({ error: `User doesn't exits.`, success: false })
        }
        if (!userData.isApproved) {
            return res.json({ error: 'Your account is not active.', success: false })
        }
        if (userData.dataValues.role_id != process.env.ROLE_PUBLIC_USER) {
            const requestBody = {
                orgName: networkHooks.sanitize(userData.organization.name),
                userName: req.body.username,
                password: req.body.password,
            }
            const response = await networkHooks.callNetworkApi('auth/verify/password', 'POST', requestBody, 'DEFAULT', false)
            return res.json(Object.assign({}, response, { userData }))
        } else if (userData.dataValues.role_id == process.env.ROLE_PUBLIC_USER) {
            return res.json({ success: true, isPublicUser: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/authVerifyStepTwo', async (req, res) => {
    try {
        const requestBody = {
            transactionPassword: req.body.transactionPassword,
            tempToken: req.body.authToken,
        }
        const response = await networkHooks.callNetworkApi('auth/verify/transaction-password', 'POST', requestBody, 'DEFAULT', false)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/authLogin', async (req, res) => {
    try {
        const requestBody = {
            otp: req.body.otp,
            tempToken: req.body.authToken,
        }
        const response = await networkHooks.callNetworkApi('auth/login', 'POST', requestBody, 'DEFAULT', false)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/verifyToken', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi('auth/verify/password', 'POST', req.body, 'DEFAULT', false)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
