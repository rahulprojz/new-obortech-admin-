/* eslint-disable eqeqeq */
/* eslint-disable radix */
/* eslint-disable camelcase */
// Load dependencies
const express = require('express')
const jwt = require('jsonwebtoken')
const multipart = require('connect-multiparty')
const statusCode = require('../../utils/statusCodes')
const string = require('../helpers/LanguageHelper')
const userHelper = require('../helpers/user-helper')
const emailHelper = require('../helpers/email-helper')
const projectHelper = require('../helpers/project-helper')

const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })
const { hostAuth } = require('../middlewares')
const { sendInvitationEmail, sendSyncedEmail, sendApprovalEmail, sendBlockchainRequestEmail } = require('../utils/emailHelpers')
const { sendUserApprovalInvite } = require('../helpers/profile-approval')
const { deleteFile } = require('../helpers/s3-helper')
const { createSubDomain } = require('../services/organization_service')

const cronHelper = require('../helpers/cron-helper')
// Load MySQL Models
const db = require('../models')

const { Op } = db.Sequelize
const Organization = db.organizations
const OrganizationTypes = db.organization_type
const OrganizationDocuments = db.organization_documents
const OrganizationCategories = db.organization_categories
const User = db.users
const City = db.cities
const Country = db.countries
const State = db.states
const ParticipantCategory = db.participant_categories
const ProjectParticipantCategories = db.project_participant_categories
const UserType = db.user_types
const UserTitle = db.user_titles
const Role = db.roles
const { sequelize } = db
const ApprovedBy = db.approved_by
const Invitation = db.invitation
const TempOrgApprove = db.temp_org_approve
const DocumentType = db.document_type

// Define global variables
const router = express.Router()
const invitationSecret = 'OBINVITESESECRET!@#$%'

// API for adding invited organization
router.post('/add', [hostAuth, multipartMiddleware], async (req, res) => {
    try {
        let decoded = { organizationType: 1, mspType: 1, invitedBy: 1 }
        decoded = jwt.verify(req.body.verification, invitationSecret)

        // Get host user
        const host = await User.findOne({
            attributes: ['organization_id', 'unique_id', 'email', 'username'],
            include: [{ model: Organization }],
            where: { id: decoded.invitedBy, isDeleted: 0 },
        })

        const orgData = Object.assign({}, req.body, {
            organization_type_id: parseInt(decoded.organizationType),
            msp_type: parseInt(decoded.mspType),
            sync_status: 0,
            streetAddress: req.body.street_address,
            invited_by: host.organization_id,
        })

        if (decoded.language == 'mn' && decoded.idVerify) {
            orgData.is_mvs_verified = 1
        }
        const organization = await Organization.create(orgData)

        await OrganizationDocuments.create({
            organization_id: organization.id,
            type_id: req.body.document_type,
            name: req.body.document_name,
            hash: req.body.hash,
        })

        await Invitation.update(
            {
                invitationExpired: true,
                organization_id: organization.id,
            },
            {
                where: { invited_by: decoded.invitedBy },
            },
        )

        const hostOrg = await Organization.findOne({ where: { id: host.organization_id, isDeleted: 0 } })
        await sendApprovalEmail(host.email, host.username, req.body.name, decoded.language)

        // Get organization type
        const organization_type = await OrganizationTypes.findByPk(parseInt(decoded.organizationType))
        const msp_type = parseInt(decoded.mspType) == 1 ? 'FabricCA' : 'Vault'

        res.json({ organization, host, document: req.body.hash, hostOrg, organization_type, msp_type })
    } catch (err) {
        if (err.message == 'jwt expired') {
            await Invitation.update({ invitationExpired: true }, { where: { invitation_link: req.body.verification } })
            return res.json({ error: 'Invite Expired' })
        }
        return res.json({ error: err.message || err.toString() })
    }
})

// Get organization by id
router.post('/getorg', hostAuth, async (req, res) => {
    try {
        const { id } = req.body
        const organization = await Organization.findOne({
            include: [
                {
                    attributes: ['id', 'name'],
                    model: City,
                },
                {
                    attributes: ['id', 'name'],
                    model: Country,
                },
                {
                    attributes: ['id', 'name'],
                    model: State,
                },
                {
                    model: UserType,
                },
            ],
            where: { id, isDeleted: 0 },
        })
        res.json(organization)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Fetch Verified Org data
router.get('/fetchVerifiedOrg', async (req, res) => {
    try {
        const filter = {
            include: [
                {
                    attributes: ['id', 'name'],
                    model: City,
                },
                {
                    attributes: ['id', 'name'],
                    model: Country,
                },
                {
                    attributes: ['id', 'name'],
                    model: State,
                },
                {
                    model: OrganizationCategories,
                    separate: true,
                    include: [
                        {
                            model: ParticipantCategory,
                        },
                    ],
                },
                {
                    model: UserType,
                },
                {
                    model: ApprovedBy,
                },
                {
                    model: User,
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        {
                            attributes: ['id', 'name'],
                            model: City,
                        },
                        {
                            attributes: ['id', 'name'],
                            model: Country,
                        },
                        {
                            attributes: ['id', 'name'],
                            model: State,
                        },
                        {
                            model: Organization,
                        },
                        {
                            model: UserTitle,
                        },
                        {
                            model: Role,
                        },
                    ],
                    required: true,
                    separate: true,
                    order: [['id', 'ASC']],
                },
                {
                    model: ApprovedBy,
                },
                {
                    model: OrganizationDocuments,
                    separate: true,
                    as: 'documents',
                    include: [
                        {
                            model: DocumentType,
                        },
                    ],
                },
            ],
        }
        let resp = await ApprovedBy.findAll({
            where: {
                approved_by: req.user.organization_id,
            },
            attributes: ['id'],
            order: [['id', 'DESC']],
            include: [
                {
                    model: Organization,
                    approved_by: req.user.organization_id,
                    as: 'orgnization',
                    include: filter.include,
                    where: {
                        [Op.or]: [
                            {
                                invited_by: { [Op.ne]: req.user.organization_id },
                                id: { [Op.ne]: req.user.organization_id },
                            },
                        ],
                        isDeleted: 0,
                    },
                },
            ],
        })

        const data = []
        resp = JSON.parse(JSON.stringify(resp))
        resp.map((org) => data.push(org.orgnization))
        return res.send(data)
    } catch (error) {
        return res.send({ error: error.message })
    }
})

// Fetch Org data
router.get('/fetchOrgs', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        let whereCondition = {
            isDeleted: 0,
            [Op.or]: [{ invited_by: req.user.organization_id }, { id: req.user.organization_id }],
        }

        // All Admin's will see all orgs
        if (req.user.role_id == process.env.ROLE_ADMIN) {
            whereCondition = { isDeleted: 0 }
        }
        const filter = {
            include: [
                {
                    attributes: ['id', 'name'],
                    model: City,
                },
                {
                    attributes: ['id', 'name'],
                    model: Country,
                },
                {
                    attributes: ['id', 'name'],
                    model: State,
                },
                {
                    model: OrganizationCategories,
                    separate: true,
                    include: [
                        {
                            model: ParticipantCategory,
                        },
                    ],
                },
                {
                    model: UserType,
                },
                {
                    model: ApprovedBy,
                },
                {
                    model: User,
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        {
                            attributes: ['id', 'name'],
                            model: City,
                        },
                        {
                            attributes: ['id', 'name'],
                            model: Country,
                        },
                        {
                            attributes: ['id', 'name'],
                            model: State,
                        },
                        {
                            model: Organization,
                        },
                        {
                            model: UserTitle,
                        },
                        {
                            model: Role,
                        },
                    ],
                    required: true,
                    separate: true,
                    order: [['id', 'ASC']],
                },
                {
                    model: ApprovedBy,
                },
                {
                    model: OrganizationDocuments,
                    separate: true,
                    as: 'documents',
                    include: [
                        {
                            model: DocumentType,
                        },
                    ],
                },
            ],
            where: whereCondition,
            order: [['createdAt', 'DESC']],
        }
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
        }
        const orgs = limit ? await Organization.findAndCountAll(filter) : await Organization.findAll(filter)
        res.json(orgs)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/fetchOrgType', async (req, res) => {
    try {
        const orgTypes = await OrganizationTypes.findAll()
        res.json(orgTypes)
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

router.post('/org-isvalid', async (req, res) => {
    try {
        const { name } = req.body
        const count = await Organization.count({ where: { name } })
        if (count) {
            res.status(200).json({ isExist: true })
        } else {
            res.status(200).json({ isExist: false })
        }
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

// API for checking the organization name already exists in DB
router.get('/existsByName', async (req, res) => {
    const { name } = req.query
    const query = { attributes: ['name'], where: { name, isDeleted: 0 } }
    try {
        const existingOrg = await Organization.findOne(query)
        if (existingOrg)
            res.json({
                code: statusCode.successData.code,
                data: { nameExists: true },
                message: statusCode.successData.message,
            })
        else
            res.json({
                code: statusCode.notFound.code,
                data: { nameExists: false },
                message: statusCode.notFound.message,
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for checking the organization stateId already exists in DB
router.post('/existsByStateId', async (req, res) => {
    const { stateId } = req.body
    try {
        const existingOrg = await Organization.findOne({
            attributes: ['state_id'],
            where: { state_registration_id: stateId, isDeleted: 0 },
        })
        if (existingOrg)
            res.json({
                code: statusCode.successData.code,
                data: { nameExists: true },
                message: statusCode.successData.message,
            })
        else
            res.json({
                code: statusCode.notFound.code,
                data: { nameExists: false },
                message: statusCode.notFound.message,
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for checking the username already exists in DB
router.get('/existsByUsername', async (req, res) => {
    const { username } = req.query
    const query = { attributes: ['username'], where: { username, isDeleted: 0 } }
    try {
        const existingUser = await User.findOne(query)
        if (existingUser)
            res.json({
                code: statusCode.successData.code,
                data: { usernameExists: true },
                message: statusCode.successData.message,
            })
        else
            res.json({
                code: statusCode.notFound.code,
                data: { usernameExists: false },
                message: statusCode.notFound.message,
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for get organization approvers
router.post('/get-approvers', async (req, res) => {
    try {
        const { orgId } = req.body
        const approvalOrganizaitons = await ApprovedBy.findAll({
            attributes: [],
            include: [
                {
                    model: Organization,
                    attributes: ['name'],
                    required: true,
                    as: 'approver',
                    where: { isDeleted: 0 },
                },
            ],
            where: { organization_id: orgId, isVerified: true },
        })
        res.json(approvalOrganizaitons)
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

// API for approving the organization
router.post('/fetch-invite', async (req, res) => {
    try {
        const jwt_token = req.body
        const invitationData = await Invitation.findOne({
            attributes: ['invitationExpired'],
            where: { email: jwt_token.email },
        })
        res.json(invitationData)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for inviting the organization
router.post('/invite-organization', async (req, res) => {
    try {
        const { email, firstName, lastName, organizationType, mspType, uniqueId, language, idVerify } = req.body
        const emailAlreadyRegistered = await Invitation.findOne({
            where: { email, invitation_type: 'organization' },
        })
        const isExistsOnUser = await User.findOne({ where: { email, isDeleted: 0 } })
        if (emailAlreadyRegistered || isExistsOnUser) {
            return res.json({
                organizationAlreadyExists: !!isExistsOnUser,
                invitationAlreadyExists: !!emailAlreadyRegistered,
            })
        }

        // Create Email Verification Link
        const verificationLink = jwt.sign(
            {
                email,
                organizationType,
                mspType,
                uniqueId,
                invitedBy: req.user.id || 1,
                type: 'organization',
                language,
                idVerify,
                blockchainName: req.user.organization.blockchain_name,
            },
            invitationSecret,
            { expiresIn: '7d' },
        )

        await Invitation.create({
            email,
            first_name: firstName,
            last_name: lastName,
            invited_by: req.user.id,
            invitation_link: verificationLink,
            invitation_type: 'organization',
            language,
        })

        const userOrg = await Organization.findOne({ where: { id: req.user.organization_id, isDeleted: 0 } })

        await sendInvitationEmail(email, firstName, lastName, verificationLink, userOrg.name, 'org', language)
        // return

        res.status(200).json({
            code: statusCode.successData.code,
            data: {
                message: string.apiResponses.orgInvitedSuccess,
            },
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

// API for resend inviting the organization
router.post('/resend-invite-organization', async (req, res) => {
    try {
        const { email, first_name, last_name, organizationType, mspType, uniqueId, language, idVerify } = req.body
        // Create Email Verification Link
        const jwtObj = {
            email,
            organizationType,
            mspType,
            uniqueId,
            invitedBy: req.user.id || 1,
            type: 'organization',
            language,
            blockchainName: req.user.organization.blockchain_name,
        }
        if (language == 'mn') jwtObj.idVerify = idVerify
        const verificationLink = jwt.sign(jwtObj, invitationSecret, { expiresIn: '7d' })

        await Invitation.update({ invitationExpired: false, invitation_link: verificationLink }, { where: { email, invitation_type: 'organization' } })

        const userOrg = await Organization.findOne({ where: { id: req.user.organization_id, isDeleted: 0 } })

        await sendInvitationEmail(email, first_name, last_name, verificationLink, userOrg.name, 'org', language)
        // return

        res.status(200).json({
            code: statusCode.successData.code,
            data: {
                message: string.apiResponses.orgInvitedSuccess,
            },
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

// API for inviting the user
router.post('/invite-user', async (req, res) => {
    try {
        const { email, firstName, lastName, language, idVerify, uniqueId } = req.body
        const isExistsOnInvite = await Invitation.findOne({ where: { email, invitation_type: 'user' } })
        const isExistsOnUser = await User.findOne({ where: { email, isDeleted: 0 } })
        if (isExistsOnInvite || isExistsOnUser) {
            return res.json({
                invitationAlreadyExists: !!isExistsOnInvite,
                userAlreadyExists: !!isExistsOnUser,
            })
        }
        const userData = await User.findOne({
            include: [
                {
                    model: Organization,
                },
            ],
            where: { id: req.user.id, isDeleted: 0 },
        })

        // if (!userData.organization || (userData.organization.organization_type_id != process.env.ORG_TYPE_NORMAL && userData.organization.organization_type_id != process.env.ORG_TYPE_HOST)
        // ) {
        //     return res.json({
        //         error: "Does not have permission to invite others"
        //     });
        // }

        // Create Email Verification Link
        const verificationLink = jwt.sign(
            {
                email,
                uniqueId,
                orgId: userData.organization_id,
                invitedBy: req.user.id,
                type: 'user',
                language,
                idVerify,
                blockchainName: req.user.organization.blockchain_name,
            },
            invitationSecret,
            { expiresIn: '7d' },
        )
        await Invitation.create({
            email,
            first_name: firstName,
            last_name: lastName,
            invited_by: req.user.id,
            invitation_link: verificationLink,
            invitation_type: 'user',
            language,
        })

        await sendInvitationEmail(email, firstName, lastName, verificationLink, req.user.organization.name, 'user', language)

        res.status(200).json({
            code: statusCode.successData.code,
            data: {
                message: string.apiResponses.orgInvitedSuccess,
            },
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// API for resend inviting the user
router.post('/resend-invite-user', async (req, res) => {
    try {
        const { email, first_name, last_name, language, idVerify, uniqueId } = req.body
        const userData = await User.findOne({
            include: [
                {
                    model: Organization,
                },
            ],
            where: { id: req.user.id, isDeleted: 0 },
        })
        const jwtObj = {
            email,
            orgId: userData.organization_id,
            invitedBy: req.user.id,
            type: 'user',
            language,
            uniqueId,
            blockchainName: req.user.organization.blockchain_name,
        }
        if (language == 'mn') jwtObj.idVerify = idVerify
        const verificationLink = jwt.sign(jwtObj, invitationSecret, { expiresIn: '7d' })
        await Invitation.update({ invitationExpired: false, invitation_link: verificationLink }, { where: { email, invitation_type: 'user' } })

        const userOrg = await Organization.findOne({ where: { id: req.user.organization_id, isDeleted: 0 } })
        await sendInvitationEmail(email, first_name, last_name, verificationLink, userOrg.name, 'user', language)

        res.status(200).json({
            code: statusCode.successData.code,
            data: {
                message: string.apiResponses.orgInvitedSuccess,
            },
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// API for removing the invitation data
router.post('/invite-remove', async (req, res) => {
    const { email, id } = req.body
    try {
        const invitation = await Invitation.destroy({
            where: { id, email },
        })
        res.json(invitation)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for updating the organization
router.post('/update', async (req, res) => {
    try {
        const { id, name, organization_categories, statusUpdate, regAndNameUpdated = false } = req.body
        const checkOrganizationExists = await Organization.findAll({
            where: {
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.toLowerCase()),
                isDeleted: 0,

                [Op.not]: [{ id }],
            },
        })

        if (!req.body.unique_id) req.body.unique_id = userHelper.getOrgUniqId(name)
        if (!statusUpdate) {
            req.body.is_mvs_verified = 0
        }
        if (checkOrganizationExists.length > 0) {
            res.json({ organizationAlreadyExists: true })
        } else {
            const record = await Organization.update(req.body, {
                where: { id },
            })
            if (regAndNameUpdated) {
                sendUserApprovalInvite(req.user, 'organization')
            }
            if (organization_categories.length) {
                const categories = organization_categories.map((catId) => ({ category_id: catId, org_id: id }))
                await OrganizationCategories.destroy({ where: { org_id: id } })
                await OrganizationCategories.bulkCreate(categories)
                await projectHelper.updateOrgCategoryProjects(id, organization_categories)
            }

            res.json(record)
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// API for updating the CCP for organization
router.post('/update-org', async (req, res) => {
    try {
        const record = await Organization.update({ ccp_name: req.body.ccp_name }, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// API for removing the organization
router.post('/remove', async (req, res) => {
    // Delete connection profile from AWS
    // await deleteFile(req.body.ccp_name)

    // Delete organization from database
    await User.destroy({
        where: {
            organization_id: req.body.id,
        },
    })
    const organization = await Organization.destroy({
        where: { id: req.body.id },
    })

    await cronHelper.cronRestartApi()

    res.json(organization)
})

// API for approving the organization
router.post('/approve', async (req, res) => {
    try {
        const { id, approver_org_id, msp_type, org_name } = req.body
        const updateObj = { isApproved: true }
        const approvedByWhere = { organization_id: id, approved_by: approver_org_id }
        const orgData = await Organization.findOne({ where: { id, isDeleted: 0 } })
        const approvedBy = await ApprovedBy.findAll({ where: approvedByWhere })
        if (orgData && orgData.sync_status != 2) updateObj.sync_status = 1

        await TempOrgApprove.create({
            org_id: id,
            org_name,
            msp_type,
        })

        // The particular org haven't by approved anyone at the time only we create data and send a mail.
        if (!approvedBy.length) {
            await Organization.update(updateObj, { where: { id } })
            await ApprovedBy.create(approvedByWhere)
            await sendBlockchainRequestEmail(org_name)
        } else {
            await ApprovedBy.update({ isVerified: true }, { where: approvedByWhere })
            if (orgData.invited_by == approver_org_id) {
                await Organization.update(updateObj, { where: { id } })
                await User.update({ isApproved: true, status: true }, { where: { organization_id: id, isDeleted: 0 } })
            }
        }

        res.json('Organization Approved')
    } catch (err) {
        console.log({ err })
        res.json({ error: err.message || err.toString() })
    }
})

// API to change sync status
router.post('/change-sync-status', async (req, res) => {
    try {
        const { id } = req.body

        const organization = await Organization.findOne({ where: { id, isDeleted: 0 } })

        if (organization.sync_status != 2) {
            await Organization.update(
                {
                    sync_status: 2,
                },
                { where: { id, isDeleted: 0 } },
            )

            // Send email to user
            const userModel = await User.findOne({
                where: {
                    organization_id: id,
                    role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                },
            })

            if (userModel && organization) {
                const { id: userId, email, language, username } = userModel
                const userTransactionPassword = await userHelper.addUserToNetwork(userId)
                await Invitation.destroy({ where: { email } })
                await projectHelper.addOrganizationStations(id)
                await User.update(
                    {
                        isApproved: 1,
                    },
                    { where: { id: userId, isDeleted: 0 } },
                )
                await emailHelper.sendApprovalEmail(email, language, username, userTransactionPassword.transactionPassword)
                await sendSyncedEmail(userModel, organization, res)
            }
        }
        res.json({
            success: true,
            message: 'Sync status changed',
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/isApprovedByOrg', async (req, res) => {
    try {
        const { id } = req.body
        const record = await ApprovedBy.findOne({
            where: {
                approved_by: req.user.organization_id,
                organization_id: id,
            },
        })
        res.json(!!record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Api to search org for Payments systems

router.post('/fetch-project-participant-categories', async (req, res) => {
    try {
        let orgs
        const projectParticipantCateories = await ProjectParticipantCategories.findAll({
            attributes: ['participant_category_id'],
            where: {
                project_category_id: {
                    [Op.in]: req.body.catIds,
                },
            },
        })

        if (projectParticipantCateories) {
            const orgCategories = projectParticipantCateories.map((category) => category.participant_category_id)
            if (orgCategories) {
                const categories = await OrganizationCategories.findAll({
                    where: {
                        category_id: { [Op.in]: orgCategories },
                    },
                    include: [
                        {
                            model: Organization,
                            required: true,
                            where: { isDeleted: 0 },
                        },
                    ],
                    group: ['org_id'],
                })
                orgs = categories.map((cat) => cat.organization)
            }
        }
        res.json(orgs)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get user's organization by userId
router.post('/get-user-org', async (req, res) => {
    try {
        const { userId } = req.body
        const organization = await Organization.findOne({
            include: [
                {
                    attributes: ['id'],
                    model: User,
                    where: { unique_id: userId },
                },
            ],
            attributes: ['id', 'name'],
            where: {
                isDeleted: 0,
            },
        })
        res.json(organization)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch organization based on Project category
router.post('/fetch-project-participant-category', async (req, res) => {
    try {
        const whereObj = {}
        const { pCategoryId } = req.body
        if (Array.isArray(pCategoryId) && pCategoryId.length > 0) {
            whereObj.project_category_id = { [Op.in]: pCategoryId }
        } else {
            whereObj.project_category_id = pCategoryId
        }
        const pCategories = await ProjectParticipantCategories.findAll({
            where: whereObj,
            include: [
                {
                    model: ParticipantCategory,
                    include: [
                        {
                            model: OrganizationCategories,
                            include: [
                                {
                                    model: Organization,
                                    attributes: ['id', 'name', 'blockchain_name'],
                                    where: { sync_status: 2, isDeleted: 0 },
                                },
                            ],
                        },
                    ],
                },
            ],
        })
        res.json(pCategories)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/fetchOrgsByCategory', async (req, res) => {
    try {
        const categories = await OrganizationCategories.findAll({
            where: {
                category_id: { [Op.in]: req.body.catIds },
            },
            include: [
                {
                    model: Organization,
                    required: true,
                },
            ],
            group: ['org_id'],
        })
        const orgs = categories.map((cat) => cat.organization)
        res.json(orgs)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
