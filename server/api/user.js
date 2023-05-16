// Load dependencies
const express = require('express')
const md5 = require('md5')
const axios = require('axios')
const statusCode = require('../../utils/statusCodes')
const string = require('../helpers/language-helper')
const emailHelper = require('../helpers/email-helper')
const userHelper = require('../helpers/user-helper')
const cronHelper = require('../helpers/cron-helper')

const { sendUserApprovalInvite, sendUserUpdationInviteToCeo, sendApprovalRejectionEmail, sendProfileEmail } = require('../helpers/profile-approval')

// Load MySQL Models
const db = require('../models')

const User = db.users
const Organization = db.organizations
const OrganizationCategories = db.organization_categories
const RequestPurpose = db.requestpurpose
const Title = db.user_titles
const Type = db.user_types
const Country = db.countries
const State = db.states
const City = db.cities
const ApprovedBy = db.approved_by
const Invitation = db.invitation
const { sequelize } = db
const { Op } = db.Sequelize
const ProjectParticipant = db.project_participants
const ProjectUser = db.project_users
const UserGithubDetail = db.user_github_details
const ProjectSidebarFolders = db.project_sidebar_folders
const { ROLE_CEO, ROLE_ADMIN, ROLE_USER, ROLE_MANAGER, ROLE_PUBLIC_USER, ROLE_SENIOR_MANAGER } = process.env
const { hostAuth } = require('../middlewares')

// Define global variables
const router = express.Router()

// To check github details
router.get('/check-github-username/:username', hostAuth, async (req, res) => {
    try {
        const { username } = req.params
        const gitDetails = await UserGithubDetail.findOne({
            where: {
                username: username,
            },
        })
        if (gitDetails) {
            res.json({ status: true })
        } else {
            res.json({ status: false })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.use((req, res, next) => {
    if (!req.user) {
        res.status(statusCode.unAuthorized.code).json({ error: string.statusResponses.unAuthoried, code: statusCode.unAuthorized.code, message: statusCode.unAuthorized.message })
        return
    }
    next()
})

router.get('/orgUsers', async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Organization, where: { isDeleted: 0 } }],
            where: {
                isDeleted: 0,
            },
        })
        res.status(200).json({ code: statusCode.successData.code, data: users, message: statusCode.successData.message })
    } catch (err) {
        res.status(401).json({ code: statusCode.unAuthorized.code, data: { message: err.message }, message: statusCode.unAuthorized.message })
    }
})

router.post('/orgUsers/approve', async (req, res) => {
    const { isApproved } = req.body
    try {
        const users = await User.findAll({
            include: [{ model: Organization, where: { isDeleted: 0 } }],
            where: { isDeleted: 0 },
        })
        res.status(200).json({ code: statusCode.successData.code, data: users, message: statusCode.successData.message })
    } catch (err) {
        res.status(401).json({ code: statusCode.unAuthorized.code, data: { message: err.message }, message: statusCode.unAuthorized.message })
    }
})

router.post('/changeLanguage/:id', async (req, res) => {
    const { code } = req.body
    const { id } = req.params
    try {
        const users = await User.update({ language: code.toLowerCase() }, { where: { id, isDeleted: 0 } })
        res.status(200).json({ code: statusCode.successData.code, data: users, message: statusCode.successData.message })
    } catch (err) {
        res.status(401).json({ code: statusCode.unAuthorized.code, data: { message: err.message }, message: statusCode.unAuthorized.message })
    }
})

// Fetch Participants code
router.get('/fetch', async (req, res) => {
    try {
        const participants = await User.findAll({
            include: [
                {
                    model: Organization,
                    where: {
                        isDeleted: 0,
                    },
                },
            ],
            where: {
                role_id: {
                    [Op.ne]: ROLE_ADMIN,
                },
                status: 1,
                isDeleted: 0,
            },
            order: [['id', 'ASC']],
        })
        res.json(participants)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// fetchallUsers
router.get('/fetchAllUsers', async (req, res) => {
    try {
        const users = await User.findAll({
            include: [
                {
                    model: Organization,
                    where: { isDeleted: 0 },
                },
            ],
            attributes: ['username', 'email', 'unique_id'],
            order: [['id', 'ASC']],
            where: {
                role_id: {
                    [Op.or]: [ROLE_USER, ROLE_MANAGER, ROLE_CEO, ROLE_SENIOR_MANAGER],
                },
                isDeleted: 0,
            },
        })
        res.json(users)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add User code
router.post('/add', async (req, res) => {
    try {
        // Get organization name
        const uniqueId = await userHelper.getUniqId(req.body.organization_id)
        const participant = await User.create({
            unique_id: uniqueId,
            participant_category_id: req.body.participant_category_id,
            password: md5(req.body.password),
            email: req.body.email,
            username: req.body.username,
            mobile: req.body.mobile || '',
            organization_id: req.body.organization_id ? parseInt(req.body.organization_id) : 0,
            role_id: req.body.role_id ? parseInt(req.body.role_id) : 0,
            title_id: req.body.title_id ? parseInt(req.body.title_id) : 0,
            isApproved: req.body.isApproved ? req.body.isApproved : 0,
        })

        if (participant) {
            // Add user to project
            const projectOrg = await ProjectParticipant.findAll({
                where: {
                    participant_id: parseInt(req.body.organization_id),
                },
            })
            if (projectOrg) {
                const projectUsersArr = []
                projectOrg.map((project_org, i) => {
                    projectUsersArr.push({
                        project_id: project_org.project_id,
                        user_id: participant.id,
                    })
                })
                if (projectUsersArr.length) {
                    await ProjectUser.bulkCreate(projectUsersArr)
                }
            }
            res.json(participant)
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add Org User code
router.post('/orgUser', async (req, res) => {
    try {
        const participant = await User.create({
            organization_id: req.body.organization_id,
            role_id: req.body.role_id,
            type_id: req.body.type_id,
            password: md5(req.body.password),
            email: req.body.email,
            username: req.body.username,
        })
        if (participant) {
            res.status(200).json({ code: statusCode.success.code, data: participant, message: statusCode.success.message })
        } else {
            res.json({ error: string.statusResponses.insertRecordErr })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update User code
router.post('/update', async (req, res) => {
    try {
        const where = {
            project_id: null,
            parent: null,
            name: req.body.username,
            user_id: req.body.id,
        }
        const folderAlreadyExist = await ProjectSidebarFolders.findOne({ where })
        // Hash password if exists
        if (req.body.password && req.body.role_id == process.env.ROLE_PUBLIC_USER) {
            req.body.password = md5(req.body.password)
        } else {
            delete req.body.password
        }
        if (req.body.role_id == process.env.ROLE_MANAGER) {
            if (!folderAlreadyExist) ProjectSidebarFolders.create(where)
        } else {
            if (folderAlreadyExist) ProjectSidebarFolders.destroy({ where: { user_id: req.body.id, name: req.body.username } })
        }
        const record = await User.update(req.body, { where: { id: req.body.id, isDeleted: 0 } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove User code
router.post('/remove', async (req, res) => {
    try {
        const { id, email } = req.body
        const record = await User.update({ isDeleted: 1 }, { where: { id } })
        await Invitation.destroy({ where: { email } })
        const projectUser = await ProjectUser.findAll({
            where: { user_id: id },
            group: 'project_id',
        })
        if (projectUser.length) {
            await ProjectUser.destroy({ where: { user_id: id } })
        }
        await cronHelper.cronRestartApi()

        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/approve', async (req, res) => {
    try {
        const { id, organization_id, username, isApproved, email } = req.body
        const userInfo = await User.findOne({ where: { id, isDeleted: 0 } })
        const authUser = req.user
        const isAuthCEO = authUser.role_id == process.env.ROLE_CEO
        const isAuthAdmin = authUser.role_id == process.env.ROLE_ADMIN
        const where = { organization_id: userInfo.organization_id, approved_by: authUser.organization_id }
        const checkIsCEO = userInfo.role_id == process.env.ROLE_CEO && (isAuthCEO || isAuthAdmin)
        let user = []

        // If user is disapproved,
        if (!isApproved) {
            await ProjectUser.destroy({
                where: {
                    user_id: id,
                },
            })
        }

        // If user is approved
        if (isApproved) {
            if (userInfo) {
                let userTransactionPassword = {}
                if (!userInfo.added_to_network) {
                    userTransactionPassword = await userHelper.addUserToNetwork(id)
                }
                if (userInfo.email && userTransactionPassword) {
                    await Invitation.destroy({ where: { email } })
                    await emailHelper.sendApprovalEmail(userInfo.email, userInfo.language, username, userTransactionPassword.transactionPassword)
                }
            }

            if (userInfo.role_id == process.env.ROLE_CEO && (isAuthCEO || isAuthAdmin)) {
                await ApprovedBy.update({ isVerified: true }, { where: { organization_id: userInfo.organization_id, approved_by: authUser.organization_id } })
            }

            if (userInfo.role_id == process.env.ROLE_CEO && (isAuthCEO || isAuthAdmin)) {
                await ApprovedBy.update({ isVerified: true }, { where: { organization_id: userInfo.organization_id, approved_by: authUser.organization_id } })
            }

            // Add user to project
            const projectOrg = await ProjectParticipant.findAll({
                where: {
                    participant_id: parseInt(organization_id),
                },
            })
            if (projectOrg) {
                const projectUsersArr = []
                projectOrg.map((project_org, i) => {
                    projectUsersArr.push({
                        project_id: project_org.project_id,
                        user_id: id,
                    })
                })
                if (projectUsersArr) {
                    await ProjectUser.bulkCreate(projectUsersArr)
                }
            }
        }

        if (checkIsCEO) {
            await userHelper.updateApprovedOrg(where, userInfo, isApproved)
            user = await User.update(
                {
                    isApproved,
                    added_to_network: 1,
                },
                { where: { id, isDeleted: 0 } },
            )
        } else {
            user = await User.update(
                {
                    isApproved,
                    status: isApproved,
                    added_to_network: 1,
                },
                { where: { id, isDeleted: 0 } },
            )
        }
        //await cronHelper.cronRestartApi()

        res.status(200).json({ code: statusCode.successData.code, data: { user, message: `${string.apiResponses.userId}:${id} ${string.apiResponses.approvalRecorded}` }, message: statusCode.successData.message })
    } catch (err) {
        console.log(err)
        res.status(400).json({ code: statusCode.emptyData.code, data: { message: string.apiResponses.failToapproveUser }, message: statusCode.emptyData.message })
    }
})

router.post('/verify', async (req, res) => {
    try {
        const { id, isVerified } = req.body
        const userInfo = await User.findByPk({ wherer: { id, isDeleted: 0 } })
        const authUser = req.user
        const isAuthCEO = authUser.role_id == process.env.ROLE_CEO
        const isAuthAdmin = authUser.role_id == process.env.ROLE_ADMIN
        const where = { organization_id: userInfo.organization_id, approved_by: authUser.organization_id }
        const checkIsCEO = userInfo.role_id == process.env.ROLE_CEO && (isAuthCEO || isAuthAdmin)
        const checkIsSeniorManager = userInfo.role_id === process.env.ROLE_SENIOR_MANAGER
        if (checkIsCEO || checkIsSeniorManager) {
            await userHelper.updateApprovedOrg(where, userInfo, isVerified)
        }

        res.status(200).json({ code: statusCode.successData.code, message: statusCode.successData.message })
    } catch (err) {
        console.log(err)
        res.status(400).json({ code: statusCode.emptyData.code, message: statusCode.emptyData.message })
    }
})

router.get('/id/:id', async (req, res) => {
    try {
        const userData = await User.findOne({
            attributes: {
                exclude: ['password'],
            },
            where: { id: req.params.id, isDeleted: 0 },
            include: [
                {
                    model: Title,
                },
                {
                    attributes: ['id', 'name', 'phonecode'],
                    model: Country,
                },
                {
                    attributes: ['id', 'name'],
                    model: City,
                },
                {
                    attributes: ['id', 'name'],
                    model: State,
                },
                {
                    model: Organization,
                    where: { isDeleted: 0 },

                    include: [
                        {
                            model: Type,
                        },
                    ],
                },
            ],
        })
        res.json(userData)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/uniqueId/:unique_id', async (req, res) => {
    try {
        const userData = await User.findOne({
            where: { unique_id: req.params.unique_id, isDeleted: 0 },
            include: [
                {
                    model: Title,
                },
                {
                    attributes: ['id', 'name', 'phonecode'],
                    model: Country,
                },
                {
                    attributes: ['id', 'name'],
                    model: City,
                },
                {
                    attributes: ['id', 'name'],
                    model: State,
                },
                {
                    model: Organization,
                    where: { isDeleted: 0 },
                    include: [
                        {
                            model: Type,
                        },
                    ],
                },
            ],
        })
        res.json(userData)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})
// API for profile update
router.post('/profile/update', async (req, res) => {
    try {
        const { isTwoFactorAuth = 0, country_code, isSMSAuth, first_name, last_name, username, email, mobile, user_id, local_first_name, local_last_name, registration_number, updateType } = req.body
        const { role_id, language } = req.user
        let record
        let existWhereObj = {
            email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), `${email}`.toLowerCase()),
            id: { [Op.ne]: user_id },
            isDeleted: 0,
        }

        // Check if emails or mobile number is exists
        if (updateType == 'mobile') {
            existWhereObj = {
                country_code,
                mobile,
                id: { [Op.ne]: user_id },
                isDeleted: 0,
            }
        }

        const userExists = await User.findOne({
            where: existWhereObj,
        })

        if (userExists) {
            return res.json(updateType == 'mobile' ? { mobileNumberAlreadyExists: true } : { emailAlreadyExists: true })
        }

        // Check if username exists
        const usernameExists = await User.findOne({
            where: {
                username: sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), username.toLowerCase()),
                id: { [Op.ne]: user_id },
                isDeleted: 0,
            },
        })
        if (usernameExists) {
            return res.json({ usernameAlreadyExists: true })
        }
        if (updateType == 'mobile') {
            record = await User.update(
                {
                    isTwoFactorAuth,
                    isSMSAuth,
                    username,
                    first_name,
                    last_name,
                    email,
                    mobile,
                    country_code,
                    local_first_name,
                    local_last_name,
                    registration_number,
                    is_mvs_verified: 0,
                },
                {
                    where: { id: user_id, isDeleted: 0 },
                },
            )
        } else {
            record = await User.update(
                {
                    isTwoFactorAuth,
                    isSMSAuth,
                    first_name,
                    last_name,
                    email,
                    mobile,
                    country_code,
                    local_first_name,
                    local_last_name,
                    registration_number,
                    is_mvs_verified: 0,
                },
                {
                    where: { id: user_id, isDeleted: 0 },
                },
            )
        }

        if (role_id == ROLE_CEO || role_id == ROLE_SENIOR_MANAGER) {
            sendUserApprovalInvite(req.user, 'user')
        }

        if (role_id == ROLE_USER || role_id == ROLE_MANAGER) {
            sendUserUpdationInviteToCeo(req.user)
        }

        // Send email notification to Admin if user changes info
        if (role_id != ROLE_ADMIN) {
            await emailHelper.sendProfileUpdateNotification(user_id, language)
        }

        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch PDC users
router.post('/fetchPdcUsers', async (req, res) => {
    try {
        const { orgs, participants } = req.body
        const usersData = []
        let users = await User.findAll({
            attributes: ['unique_id', 'id', 'role_id', 'username', 'language', 'organization_id'],
            where: {
                organization_id: {
                    [Op.in]: orgs,
                },
                isApproved: 1,
                status: 1,
                isDeleted: 0,
                // role_id: {
                //     [Op.ne]: 4,
                // },
            },
            include: [{ model: Organization, where: { isDeleted: 0 }, attributes: ['id', 'unique_id', 'name', 'local_name', 'blockchain_name'] }],
        })
        users.map((user) => {
            usersData.push(user.dataValues)
        })
        if (participants) {
            const orgParticipants = await OrganizationCategories.findAll({
                include: [
                    {
                        model: Organization,
                        attributes: ['id', 'unique_id', 'name', 'local_name', 'blockchain_name'],
                        include: [
                            {
                                model: User,
                                where: { isDeleted: 0 },
                                attributes: ['unique_id', 'id', 'role_id', 'username', 'language', 'organization_id'],
                                include: [{ model: Organization, attributes: ['id', 'unique_id', 'name', 'local_name', 'blockchain_name'] }],
                            },
                        ],
                        required: true,
                        where: {
                            sync_status: 2,
                            isApproved: 1,
                            isDeleted: 0,
                            id: { [Op.notIn]: orgs },
                        },
                    },
                ],
                where: { category_id: { [Op.in]: participants } },
            })

            orgParticipants.forEach((participant) => {
                const organization = JSON.parse(JSON.stringify(participant.organization.dataValues))
                delete organization.users
                participant.organization.users.map((user) => {
                    const usr = user.dataValues
                    user.organization = organization
                    usersData.push(usr)
                })
            })
        }
        res.json(usersData)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Add public user code
router.post('/addPublicUser', async (req, res) => {
    try {
        const { username, password } = req.body

        // Check if username exists
        const usernameExists = await User.findOne({
            where: {
                username: sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), username.toLowerCase()),
                isDeleted: 0,
            },
        })
        if (usernameExists) {
            res.json({ usernameAlreadyExists: true })
        } else {
            const uniqueId = await userHelper.getUniqId(req.user.organization_id)
            const user =
                req.user && req.user.organization_id
                    ? await User.create({
                          unique_id: uniqueId,
                          username,
                          password: md5(password),
                          role_id: ROLE_PUBLIC_USER,
                          organization_id: req.user.organization_id,
                      })
                    : null
            if (user) {
                res.json(user)
            } else {
                res.json({ error: string.statusResponses.insertRecordErr })
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// To Invalidate user account
router.post('/invalidate', (req, res) => {
    try {
        User.update(
            {
                isApproved: false,
                status: false,
            },
            {
                where: { id: req.user.id, isDeleted: 0 },
            },
        ).then((result) => {
            if (result) {
                res.json({ status: true })
            } else {
                res.json({ error: string.apiResponses.failToInvalidateUser })
            }
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// To send org approval rejection email to ceo of the organization
router.get('/approval-rejection-email', (req, res) => {
    try {
        sendApprovalRejectionEmail(req.user, req.query)
        res.json(true)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// To share its profile to ceo of the organization
router.get('/share-profile-email', (req, res) => {
    try {
        sendProfileEmail(req.user, req.query)
        res.json(true)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// To checking approved organization
router.get('/check-approved-org/:approvedBy', async (req, res) => {
    try {
        const { approvedBy } = req.params
        const org =
            req.user && req.user.organization_id
                ? await Organization.findOne({
                      where: {
                          id: req.user.organization_id,
                          isDeleted: 0,
                      },
                      attributes: ['invited_by'],
                  })
                : null
        if (org && org.invited_by == approvedBy) {
            res.json({ status: true })
        } else {
            res.json({ status: false })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// To fetch github details
router.get('/github-details', async (req, res) => {
    try {
        const { id } = req.user
        const data = id
            ? await UserGithubDetail.findOne({
                  where: {
                      user_id: id,
                  },
              })
            : null
        if (data) {
            res.json({ status: true })
        } else {
            res.json({ status: false })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/add-github-details', async (req, res) => {
    try {
        const { body, user } = req
        const { id } = user
        const { username, token } = body

        const data = id
            ? await UserGithubDetail.create({
                  user_id: id,
                  username: username.trim(),
                  token: token.trim(),
              })
            : null
        if (data) {
            res.json({ status: true })
        } else {
            res.json({ status: false })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
