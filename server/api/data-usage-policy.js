// Load dependencies
const express = require('express')
const networkHooks = require('../hooks/network-hooks')

// Load MySQL Models
const router = express.Router()
const Sequelize = require('sequelize')
const db = require('../models')
const DataUsagePolicies = db.data_usage_polices
const PolicyRequiredData = db.policy_required_data
const PolicyAccess = db.policy_accesses
const RequestPurpose = db.requestpurpose
const { hostAuth, userAuth } = require('../middlewares')

router.use(hostAuth)
router.use(userAuth)
// Fetch all policies
router.get('/', async (req, res) => {
    try {
        const options = {include: [{ model: RequestPurpose }, { model: PolicyRequiredData }, { model: PolicyAccess }],};

        if(req.query.sort && req.query.sortBy){
            options.order = [[req.query.sortBy.toString(), req.query.sort.toString()]]
        }
    
        const allDataUsagePolicies = await DataUsagePolicies.findAll(options)
        res.json(allDataUsagePolicies)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch single Policy
router.get('/:id', async (req, res) => {
    try {
        const allDataUsagePolicies = await DataUsagePolicies.findOne(req.query.id)
        res.json(allDataUsagePolicies)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Create policy
router.post('/', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi('data-policy', 'POST', req.body)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update policy
router.patch('/', async (req, res) => {
    try {
        const { policyId } = req.body
        const response = await networkHooks.callNetworkApi(`data-policy/${policyId}`, 'PATCH', req.body)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove policy
router.delete('/', async (req, res) => {
    try {
        const { policyId } = req.body
        const response = await networkHooks.callNetworkApi(`data-policy/${policyId}`, 'DELETE', req.body)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
