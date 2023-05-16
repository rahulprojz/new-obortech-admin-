// Load dependencies
const express = require('express')
const { organization } = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const Organizations = db.organizations
const Users = db.users
const ApprovedBy = db.approved_by
const UserTitle = db.user_titles
const UserDataRequest = db.user_data_requests

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// API to find approved organizations
router.get('/fetch/:oid', async (req, res) => {
    try {
        const { oid } = req.params
        const approvals = await ApprovedBy.findAll({
            where: { organization_id: oid },
            include: [
                {
                    model: Organizations,
                    attributes: ['name'],
                    as: 'approver',
                },
            ],
            attributes: [],
        })
        const ceoUser = await Users.findOne({
            include: [
                {
                    model: UserTitle,
                    attributes: ['name'],
                },
            ],
            attributes: ['id', 'username', 'unique_id', 'organization_id', 'country_id', 'is_mvs_verified'],
            raw: true,
            where: {
                role_id: 5,
                organization_id: oid,
            },
        })
        res.json({ ceoUser, approvals })
    } catch (error) {
        console.log(error)
        res.json({ error: error.message || error.toString() })
    }
})

// API for approving the organization
router.post('/approve', async (req, res) => {
    try {
        const { org_id, approver_org_id, user_id, processor_id } = req.body
        const isDataPresent = await ApprovedBy.findOne({ where: { isVerified: true, organization_id: org_id, approved_by: approver_org_id } })
        if (!isDataPresent) {
            await ApprovedBy.create({ isVerified: true, organization_id: org_id, approved_by: approver_org_id })
        }
        else {
            await ApprovedBy.update({ isVerified: true }, { where: { organization_id: org_id, approved_by: approver_org_id } })
        }
        if (user_id && processor_id) {
            await UserDataRequest.update(
                { org_approve_status: 1 },
                {
                    where: {
                        user_id,
                        processor_id,
                    },
                },
            )
        }

        res.json('Organization Approved')
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
