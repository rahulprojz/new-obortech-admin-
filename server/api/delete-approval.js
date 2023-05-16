// Load dependencies
const express = require('express')
const db = require('../models')
const string = require('../helpers/LanguageHelper')

// Define global variables
const { sendDelOrgApprovalEmail } = require('../utils/emailHelpers')

const router = express.Router()

const DeleteApproval = db.delete_approval
const Organization = db.organizations
const User = db.users
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Create Organization Delete Request
router.post('/', async (req, res) => {
    try {
        const { module_id: moduleId } = req.body
        if (!moduleId) return res.status(500).json({ message: `module Name and module Id is required.` })
        const { role_id: roleId, id: userId } = req.user
        let deletedBy = userId

        const cond = { module_id: moduleId }

        const data = await DeleteApproval.findAll({ where: cond, raw: true })
        deletedBy = data.map((data) => data.deleted_by)
        let resp
        if (!deletedBy.includes(userId)) {
            deletedBy.push(userId)
            resp = await DeleteApproval.create({ module_id: moduleId, deleted_by: userId })
        }
        // Send E-Mail
        //if (deletedBy.length === 1) {
        if (!data.length) {
            const organization = await Organization.findOne({ where: { id: moduleId, isDeleted: 0 }, attributes: ['name'], raw: true })
            const users = await User.findAll({ where: { role_id: roleId, isDeleted: 0 }, attributes: ['id', 'email', 'first_name', 'last_name'], raw: true })

            users.map((user) => {
                if (!deletedBy.includes(user.id)) {
                    if (user.id !== req.user.id) {
                        sendDelOrgApprovalEmail(req.user, moduleId, user.email, organization.name)
                    }
                }
            })
        }
        return res.json({ success: !!resp })
    } catch (err) {
        console.log(err)
        return res.send({ error: err.message, _success: false })
    }
})

router.post('/verify', async (req, res) => {
    try {
        const { module_id } = req.body
        if (!module_id) return res.status(500).json({ message: `module Name and module Id is required.` })

        const { role_id } = req.user
        const cond = { module_id }

        const approval = await DeleteApproval.findAll({ where: cond, attributes: ['deleted_by'], logging: console.log })
        const users = await User.findAll({ where: { role_id, isDeleted: 0 }, attributes: ['id', 'email', 'first_name', 'last_name'] })

        const resp = { success: true, pending: [], deleted: [] }
        users.map((user) => {
            const isExist = approval.find((approval) => approval.deleted_by == user.id)
            resp[!isExist ? 'pending' : 'deleted'].push(user)
        })
        resp.deleteAllowed = resp.pending.length === 0
        return res.json(resp)
    } catch (error) {
        console.log(error)
        return res.send({ error: error.message })
    }
})

module.exports = router
