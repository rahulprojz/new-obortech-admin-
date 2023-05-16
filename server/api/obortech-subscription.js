const express = require('express')
const JWT = require('jsonwebtoken')
const db = require('../models')

const router = express.Router()
// const { validate } = require('express-validation')
// const { createSubscription } = require('../validations/subscription')
const { PlanInclusion } = require('../services/subscription/subscription_service')
const { Plans } = require('../services/subscription/plans')
const { DeviceContract } = require('../services/subscription/deviceContract_service')

const Subscription = db.subscription
const PlanInclusionModal = db.plan_inclusion
const Organization = db.organizations

router.post('/token', async (req, res) => {
    const { password, username } = req.body
    const { SUBSCRIPTION_USER, SUBSCRIPTION_PASS, SUBSCRIPTION_TOKEN_KEY } = process.env
    if (!username && !password) {
        res.status(400).json({ message: 'All fields required!' })
    }
    if (username !== SUBSCRIPTION_USER || password !== SUBSCRIPTION_PASS) {
        res.status(400).json({ message: 'Please check login credentials' })
    }
    JWT.sign({ username, password }, SUBSCRIPTION_TOKEN_KEY, { expiresIn: '5m' }, (err, token) => {
        if (!err) {
            return res.send({ token })
        }
        return res.status(500).send('Something went wrong')
    })
})

router.get('/org/search/:unique', async (req, res) => {
    try {
        const { authorization } = req.headers
        const { SUBSCRIPTION_TOKEN_KEY } = process.env
        if (!authorization) {
            res.status(401).send({ error: 'Unauthorized' })
        }
        const token = authorization.replace('Bearer ', '')
        JWT.verify(token, SUBSCRIPTION_TOKEN_KEY)
        const organization = await Organization.findOne({
            attributes: ['name', 'mongolianName'],
            where: { unique_id: req.params.unique, isDeleted: 0 },
        })
        res.json(organization)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// router.post('/create', validate(createSubscription), async (req, res) => {
router.post('/create', async (req, res) => {
    try {
        const { orgId, transactionId, purchase_date, duration, items, plan } = req.body
        const { authorization } = req.headers
        const { SUBSCRIPTION_TOKEN_KEY } = process.env
        if (!authorization) {
            res.status(401).send({ error: 'Unauthorized' })
        }
        const token = authorization.replace('Bearer ', '')
        JWT.verify(token, SUBSCRIPTION_TOKEN_KEY)

        const org = await Organization.findOne({
            where: {
                unique_id: orgId,
                isDeleted: 0,
            },
        })
        if (!org) {
            return res.status(400).json({ error: 'Organization is not exist' })
        }
        const activeSubscription = await Subscription.findOne({ where: { organization_id: org.id }, order: [['createdAt', 'DESC']] })
        const subscriptionRef = await Subscription.create({
            organization_id: org.id,
            transaction_id: transactionId,
            purchase_date,
            plan: plan || 'standard',
            duration: duration || 1,
            status: true,
        })
        if (activeSubscription) {
            await Subscription.update({ status: false }, { where: { id: activeSubscription.id } })
            const plans = new PlanInclusion()
            const creditCounts = await plans.getCredit(activeSubscription.id)
            const debitCounts = await plans.getDebit(activeSubscription.id)
            await plans.generateCarryForward(creditCounts, debitCounts, subscriptionRef.id)
        }
        const plans = new Plans(items, subscriptionRef.id).plans()
        const deviceContract = new DeviceContract(org.id, items)
        const devices = deviceContract.devices()
        deviceContract.createAndUpdateDevices(devices)
        await PlanInclusionModal.bulkCreate(plans)
        return res.json({
            code: 200,
            message: 'Subscription plan added successfully',
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
