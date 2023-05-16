// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const emailSender = require('../services/sendMail')
const { prepareEmailBody } = require('../helpers/email-helper')
const { getLanguageJson } = require('../utils/globalHelpers')

// Load MySQL Models
const db = require('../models')

const UserDataRequest = db.user_data_requests
const User = db.users
const RequestPurpose = db.requestpurpose
const Organization = db.organizations
const UserTitle = db.user_titles

const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

// EMAIL & OTHER CONFIGURATIONS
const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

// Add user data request
router.post('/add', async (req, res) => {
    try {
        const { requestObj, request_txn_id, controller_id, policy, request_from, processor_id } = req.body

        const user = await User.findOne({ where: { unique_id: requestObj.userid, isDeleted: 0 } })
        const purposeData = await RequestPurpose.findOne({ where: { purpose_key: requestObj.purpose } })
        let processorOrgId = req.user.organization_id

        if (processor_id) {
            const processorData = await User.findOne({ where: { id: processor_id, isDeleted: 0 } })
            if (processorData) {
                processorOrgId = processorData.organization_id
            }
        }
        const payload = {
            request_id: requestObj.requestUniqId,
            purpose_id: purposeData.id,
            controller_id,
            user_id: user.id,
            processor_id: processor_id || req.user.id,
            request_txn_id,
            status: requestObj.status,
            validity: requestObj.validity,
            status_description: requestObj.status_desc,
            is_delete_request: requestObj.is_delete_request,
            request_from,
        }
        if (requestObj.approved_by_dc && requestObj.approved_by_ds) {
            payload.approved_by_dc = requestObj.approved_by_dc
            payload.approved_by_ds = requestObj.approved_by_ds
        }

        const response = await UserDataRequest.create(payload)
        if (response) {
            // Send email to user and data controller
            await _sendEmailToUserAndCEO(processorOrgId, user, policy, requestObj.requestUniqId)
            res.json(response)
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Update user data request
router.post('/update', async (req, res) => {
    try {
        const response = await UserDataRequest.update(req.body, { where: { id: req.body.id } })
        if (response) {
            res.json(response)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch user data request
router.post('/fetchOne', async (req, res) => {
    try {
        const { userid } = req.body

        const user = await User.findOne({ where: { unique_id: userid, isDeleted: 0 } })
        const dataRequests = await UserDataRequest.findAll({
            where: {
                user_id: user.id,
                processor_id: req.user.id,
            },
            order: [['id', 'DESC']],
        })
        res.json(dataRequests)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch user data requests
router.post('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0, user } = req.body

        let whereQuery = { user_id: user.id }
        if (user.role_id == process.env.ROLE_ADMIN) {
            whereQuery = { processor_id: { [Op.ne]: 0 } }
        } else if (user.role_id == process.env.ROLE_CEO || user.role_id == process.env.ROLE_MANAGER || user.role_id == process.env.ROLE_SENIOR_MANAGER) {
            whereQuery = { [Op.or]: [{ processor_id: user.id }, { user_id: user.id }] }
        }
        whereQuery.is_delete_request = false
        const filter = {
            include: [
                {
                    model: User,
                    attributes: ['username', 'unique_id'],
                    as: 'processor',
                    include: [
                        {
                            model: UserTitle,
                            attributes: ['name'],
                        },
                    ],
                    where: { isDeleted: 0 },
                    required: true,
                },
                {
                    model: User,
                    attributes: ['username', 'unique_id', 'organization_id'],
                    as: 'user',
                    require: true,
                    where: { isDeleted: 0 },

                    include: [
                        {
                            model: Organization,
                            where: { isDeleted: 0 },
                            attributes: ['name', 'blockchain_name'],
                        },
                    ],
                },
                {
                    model: RequestPurpose,
                    attributes: ['purpose_key'],
                },
            ],
            where: whereQuery,
            order: [['id', 'DESC']],
        }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
        }
        const dataRequests = limit ? await UserDataRequest.findAndCountAll(filter) : await UserDataRequest.findAll(filter)
        res.json(dataRequests)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Delete user data request by user id
router.post('/delete/by-user-id', (req, res) => {
    try {
        UserDataRequest.destroy({
            where: { processor_id: req.body.processor_id, user_id: req.body.user_id, request_from: 'event' },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Delete user data request
router.post('/delete', (req, res) => {
    try {
        UserDataRequest.destroy({
            where: { id: req.body.id },
        }).then((record) => {
            res.json(record)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update status of user data request
router.post('/change-status', async (req, res) => {
    try {
        const { id, fromUser, status, status_description, approved_by_dc, approved_by_ds, rejected_by_dc, rejected_by_ds } = req.body
        const request = await UserDataRequest.findOne({
            where: {
                id,
            },
            include: [
                {
                    model: User,
                    attributes: ['username', 'unique_id', 'email'],
                    as: 'processor',
                    require: true,
                    where: { isDeleted: 0 },

                    include: [
                        {
                            model: UserTitle,
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: User,
                    attributes: ['username', 'unique_id', 'email'],
                    as: 'user',
                    require: true,
                    where: { isDeleted: 0 },
                    include: [
                        {
                            model: Organization,
                            attributes: ['name'],
                            where: { isDeleted: 0 },
                        },
                    ],
                },
            ],
        })

        let updatePayload = {
            status,
            status_description,
            approved_by_dc,
            approved_by_ds,
            rejected_by_dc,
            rejected_by_ds,
        }

        if (request.status === 'rejected') {
            updatePayload.status = request.status
        }
        const response = await UserDataRequest.update(updatePayload, { where: { id } })
        if (response) {
            // Sending email to data processor
            await _sendRequestUpdate(request.processor.username, status, fromUser, request.request_id, request.processor.email, req.user.language)

            // Sending email to data subject
            const from_user = fromUser == 'data subject' ? 'you' : fromUser
            await _sendRequestUpdate(request.user.username, status, from_user, request.request_id, request.user.email, req.user.language)

            res.json(response)
        } else {
            res.json(false)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Send email to user and admin
const _sendEmailToUserAndCEO = async (processorOrgId, user, policy, req_uniq_id) => {
    const view_request_url = `${SITE_URL}/user-data-request`
    const languageJson = await getLanguageJson(user.language)

    // find organization
    const organization = await Organization.findOne({ where: { id: processorOrgId, isDeleted: 0 } })

    const replacements = {
        organization: organization.name || '',
        username: user.username || '',
        purpose: policy.purpose,
        clause: policy.clause,
        data: policy.dataOprands.join(', '),
        access: policy.access.join(', '),
        view_request_url,
        URL: SITE_URL,
        req_uniq_id,
        hi: languageJson.emailContent.hi,
        hasRequested: languageJson.emailContent.hasRequested,
        dataRequestedBy: languageJson.emailContent.dataRequestedBy,
        belowDetails: languageJson.emailContent.belowDetails,
        oborInfo: languageJson.emailContent.oborInfo,
        viewRequest: languageJson.emailContent.viewRequest,
        linkText: languageJson.emailContent.notSeeViewReq,
    }

    // send email to user
    const htmlToSend = prepareEmailBody('email', 'user-data-request', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: user.email,
        subject: languageJson.notificatoinSubject.userDataRequested,
        html: htmlToSend,
    }
    emailSender.sendMail(message)

    // Send email to admin/data controller
    replacements.username = 'Obortech'
    ;(replacements.dsusername = user.username), (replacements.isAdmin = true)
    const htmlToSendAdmin = prepareEmailBody('email', 'user-data-request', replacements)
    message.to = 'gary@chaincodeconsulting.com'
    message.html = htmlToSendAdmin
    emailSender.sendMail(message)
}

// Send request udpate email to processor/user
const _sendRequestUpdate = async (username, status, fromUser, requestid, userEmail, language) => {
    const languageJson = await getLanguageJson(language)

    const view_request_url = `${SITE_URL}/user-data-request`
    const replacements = {
        fromUser,
        requestid,
        username,
        status: status == 'partially approved' ? 'approved' : status,
        view_request_url,
        URL: SITE_URL,
        hi: languageJson.emailContent.hi,
        linkText: languageJson.emailContent.notSeeViewReq,
        viewRequest: languageJson.emailContent.viewRequest,
        oborInfo: languageJson.emailContent.oborInfo,
    }

    // send email to processor
    const htmlToSend = prepareEmailBody('email', 'data-request-status', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: userEmail,
        subject: languageJson.notificatoinSubject.userDataRequestUpdated,
        html: htmlToSend,
    }
    emailSender.sendMail(message)
}

module.exports = router
