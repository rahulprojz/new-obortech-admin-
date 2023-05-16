/* eslint-disable no-await-in-loop */
// Load dependencies
const express = require('express')
// const { validate } = require('express-validation')
const string = require('../helpers/LanguageHelper')
const db = require('../models')
// const { checkPlan, details } = require('../validations/device-contract')
const { DeviceContract } = require('../services/subscription/deviceContract_service')

const DeviceContractModal = db.device_contract
const DeviceContractUsage = db.device_contract_usage
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// get temp network
// router.get('/check-device/:key', validate(checkPlan), async (req, res) => {
router.get('/check-device/:key',  async (req, res) => {
    const device = new DeviceContract()
    const response = await device.checkDeviceCountAndSubscription(req.params.key)
    return res.status(response.status).json(response)
})


// router.get('/detail/:id', validate(details), async (req, res) => {
router.get('/detail/:id', async (req, res) => {
    const counts = []
    const creditDevices = await DeviceContractModal.findAll({
        where: {
            organization_id: req.params.id,
            status: true,
        },
        attributes: ['device_id', 'type', 'id', 'quantity'],
    })

    for (let index = 0; index < creditDevices.length; index++) {
        const activeDevice = creditDevices[index]
        const obj = {}
        const debitCounts = await DeviceContractUsage.count({ where: { device_contract_id: activeDevice.id } })
        obj.debitCounts = debitCounts
        obj.creditCounts = activeDevice.quantity
        obj.device_id = activeDevice.device_id
        counts.push(obj)
    }
    return res.json(counts)
})

module.exports = router
