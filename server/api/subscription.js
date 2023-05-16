/* eslint-disable camelcase */
// Load dependencies
const express = require('express')
// const { validate } = require('express-validation')
const string = require('../helpers/LanguageHelper')
// const { createSubscription, checkPlan, details } = require('../validations/subscription')
const { PlanInclusion } = require('../services/subscription/subscription_service')
const { Plans } = require('../services/subscription/plans')
const { DeviceContract } = require('../services/subscription/deviceContract_service')
// Load MySQL Models
const db = require('../models')

const Subscription = db.subscription
const Plan_inclusion = db.plan_inclusion
const Organization = db.organizations
// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// router.post('/create', validate(createSubscription), async (req, res) => {
router.post('/create', async (req, res) => {
    try {
        const { orgId, transactionId, purchase_date, duration, items, plan } = req.body
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
        const response = await Plan_inclusion.bulkCreate(plans)
        return res.json({ response })
    } catch (err) {
        return res.json({ error: err.message || err.toString() })
    }
})

// router.get('/check-plan/:key', validate(checkPlan), async (req, res) => {
router.get('/check-plan/:key', async (req, res) => {
    const planExist = new PlanInclusion(req.params.key, req.user, res)
    const response = await planExist.checkCountExist()
    return res.json(response)
})

// router.get('/details/:id', validate(details), async (req, res) => {
router.get('/details/:id', async (req, res) => {
    const counts = []
    const subscriptionId = req.params.id
    const subscriptionInfo = await Subscription.findOne({ where: { id: subscriptionId }, attributes: ['id', 'purchase_date', 'plan'] })
    const creditPlans = await Plan_inclusion.findAll({ where: { subscription_id: subscriptionId, plan_type: 'CREDIT' }, attributes: ['plan_key', 'plan_value', 'plan_type'] })
    const carryForwardPlans = await Plan_inclusion.findAll({ where: { subscription_id: subscriptionId, plan_type: 'CF' }, attributes: ['plan_key', 'plan_value', 'plan_type'] })
    const debitPlans = await new PlanInclusion().getDebit(subscriptionId)

    creditPlans.forEach((element) => {
        const obj = {}
        const carryForward = carryForwardPlans.find((item) => item.plan_key === element.plan_key)
        const debitRef = debitPlans.find((item) => item.plan_key === element.plan_key)
        if (carryForward) {
            obj.carryForwardCount = carryForward.plan_value
        } else {
            obj.carryForwardCount = 0
        }
        if (debitRef) {
            obj.debitCounts = debitRef.plan_value
        } else {
            obj.debitCounts = 0
        }
        obj.name = element.plan_key
        obj.creditCount = element.plan_value
        counts.push(obj)
    })
    return res.json({ subscriptionInfo, counts })
})

module.exports = router
