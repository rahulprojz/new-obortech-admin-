// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const networkHooks = require('../hooks/network-hooks')
const hostAuth = require('../middlewares/hostAuth')
const userAuth = require('../middlewares/userAuth')
const jwtAuth = require('../middlewares/jwtAuth')
const { sendGitHubAccessEmail } = require('../utils/emailHelpers')

const db = require('../models')
const User = db.users
const UserGithubDetails = db.user_github_details
const SmartContractGithubAccess = db.smart_contract_github_access
const ChannelGitHubDetails = db.channel_github_details
const Organizations = db.organizations
const SmartContractProposalChannel = db.smart_contract_proposal_channel

// Define global variables
const router = express.Router()

router.use(hostAuth)

// get GitHub user details
router.get('/users/:token', async (req, res) => {
    try {
        const { token } = req.params
        const API_PATH = `user`
        const options = {
            gitHubToken: token,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Check if a user is a repository collaborator
router.get('/repos/:owner/:repo/collaborator/:username', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { owner, repo, username } = req.params
        //Get github username and token from the database
        const UserGithubDetail = await UserGithubDetails.findOne({
            include: [
                {
                    model: User,
                    where: {
                        unique_id: username,
                    },
                },
            ],
            attributes: ['username'],
        })
        if (UserGithubDetail) {
            const github_username = UserGithubDetail.username
            const API_PATH = `repos/${owner}/${repo}/collaborators/${github_username}`
            const options = {
                userName: req.user.unique_id,
            }
            const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
            res.json(response)
        } else {
            res.json({
                success: false,
                message: "User's GitHub account not linked",
            })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// List repository collaborators
router.get('/repos/:owner/:repo/collaborators', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { owner, repo } = req.params
        const API_PATH = `repos/${owner}/${repo}/collaborators`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get a repository
router.get('/repos/:owner/:repo', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { owner, repo } = req.params
        const API_PATH = `repos/${owner}/${repo}`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get GitHub user details
router.get('/users/:username', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { username } = req.params
        const API_PATH = `users/${username}`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// List repository invitations for the authenticated user
router.get('/user/repository-invitations', [jwtAuth, userAuth], async (req, res) => {
    try {
        const API_PATH = `user/repository_invitations`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add a repository collaborator
router.put('/repos/:owner/:repo/collaborators/:username', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { owner, repo, username } = req.params
        const { proposalId, organizationId, proposalName } = req.body
        const API_PATH = `repos/${owner}/${repo}/collaborators/${username}`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'PUT', req.body, 'GITHUB', false, options)
        // Add invitation ID here
        if (response) {
            const result = await SmartContractGithubAccess.update(
                {
                    invitation_id: response.id,
                    status: 'PENDING',
                },
                {
                    where: {
                        organization_id: organizationId,
                        channel_id: proposalId,
                    },
                },
            )
            // Send email to the user

            const userDetails = await Organizations.findOne({
                where: {
                    id: organizationId,
                },
                include: [
                    {
                        model: User,
                        where: {
                            role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                        },
                        attributes: ['id', 'email', 'first_name', 'last_name', 'language'],
                    },
                ],
                attributes: ['id', 'name'],
            })

            const HostOrgDetails = await SmartContractProposalChannel.findOne({
                where: {
                    proposal_name: proposalName,
                },
                include: [
                    {
                        model: ChannelGitHubDetails,
                        attributes: ['id'],
                        include: [
                            {
                                model: Organizations,
                                include: [
                                    {
                                        model: User,
                                        where: {
                                            role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            })

            const hostOrgName = HostOrgDetails.channel_github_detail.organization.name

            for (const user of userDetails.users) {
                await sendGitHubAccessEmail(user.email, user.first_name, user.last_name, hostOrgName, 'INVITATION', user.language, proposalName)
            }

            res.json(result)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Accept a repository invitation
router.patch('/user/repository-invitations/:invitationId', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { invitationId } = req.params
        const API_PATH = `user/repository_invitations/${invitationId}`
        const options = {
            userName: req.user.unique_id,
        }
        const response = await networkHooks.callNetworkApi(API_PATH, 'PATCH', null, 'GITHUB', false, options)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Reject a repository invitation
router.delete('/user/repository-invitations/:invitationId', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { invitationId } = req.params
        const API_PATH = `user/repository_invitations/${invitationId}`
        const options = {
            userName: req.user.unique_id,
        }
        let response = await networkHooks.callNetworkApi(API_PATH, 'DELETE', null, 'GITHUB', false, options)
        if (response.success) {
            const result = await SmartContractGithubAccess.update(
                {
                    status: 'REJECTED',
                },
                {
                    where: {
                        invitation_id: invitationId,
                    },
                },
            )
            if (result) {
                response = {
                    success: true,
                    status: 204,
                }
            }
        }
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Request github access
router.put('/access', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { action } = req.query
        const { organizationId, proposalId, proposalName } = req.body
        console.log('action', action)

        const result = await SmartContractGithubAccess.update(
            {
                invitation_id: null,
                status: action,
            },
            {
                where: {
                    organization_id: organizationId,
                    channel_id: proposalId,
                },
            },
        )
        if (result) {
            const HostOrgDetails = await SmartContractProposalChannel.findOne({
                where: {
                    proposal_name: proposalName,
                },
                include: [
                    {
                        model: ChannelGitHubDetails,
                        attributes: ['id'],
                        include: [
                            {
                                model: Organizations,
                                include: [
                                    {
                                        model: User,
                                        where: {
                                            role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            })
            const hostOrgName = HostOrgDetails.channel_github_detail.organization.name

            const userDetails = await Organizations.findOne({
                where: {
                    id: organizationId,
                },
                include: [
                    {
                        model: User,
                        where: {
                            role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                        },
                        attributes: ['id', 'email', 'first_name', 'last_name', 'language'],
                    },
                ],
                attributes: ['id', 'name'],
            })

            if (action == 'REQUESTED') {
                for (const user of HostOrgDetails.channel_github_detail.organization.users) {
                    await sendGitHubAccessEmail(user.email, user.first_name, user.last_name, userDetails.name, action, user.language, proposalName)
                }
            } else if (action == 'REJECTED') {
                for (const user of userDetails.users) {
                    await sendGitHubAccessEmail(user.email, user.first_name, user.last_name, hostOrgName, action, user.language, proposalName)
                }
            }
        }
        res.json(result)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get github access status for organizations
router.get('/access/:proposalName', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { proposalName } = req.params
        const SmartContractProposalData = await SmartContractProposalChannel.findOne({
            where: {
                proposal_name: proposalName,
            },
            include: [
                {
                    model: ChannelGitHubDetails,
                    include: [
                        {
                            model: SmartContractGithubAccess,
                            include: [
                                {
                                    model: Organizations,
                                    include: [
                                        {
                                            model: User,
                                            where: {
                                                role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                            },
                                            attributes: ['id'],
                                            include: [
                                                {
                                                    model: UserGithubDetails,
                                                    attributes: ['username'],
                                                },
                                            ],
                                        },
                                    ],
                                    attributes: ['id', 'name', 'blockchain_name'],
                                },
                            ],
                        },
                    ],
                },
            ],
        })
        const SmartContractDetailsData = SmartContractProposalData.channel_github_detail.dataValues
        SmartContractDetailsData.proposal_name = proposalName
        res.json(SmartContractDetailsData)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update github access status for organizations
router.patch('/access/:proposalName', [jwtAuth, userAuth], async (req, res) => {
    try {
        const { proposalName } = req.params
        const SmartContractProposalData = await SmartContractProposalChannel.findOne({
            where: {
                proposal_name: proposalName,
            },
            include: [
                {
                    model: ChannelGitHubDetails,
                    include: [
                        {
                            model: SmartContractGithubAccess,
                            include: [
                                {
                                    model: Organizations,
                                    include: [
                                        {
                                            model: User,
                                            where: {
                                                role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                            },
                                            attributes: ['id', 'unique_id'],
                                            include: [
                                                {
                                                    model: UserGithubDetails,
                                                    attributes: ['username', 'user_id'],
                                                },
                                            ],
                                        },
                                    ],
                                    attributes: ['id', 'name', 'blockchain_name'],
                                },
                            ],
                        },
                    ],
                },
            ],
        })

        const SmartContractDetailsData = SmartContractProposalData.channel_github_detail
        const hostOrgData = await SmartContractGithubAccess.findOne({
            where: {
                organization_id: SmartContractDetailsData.host_organization,
            },
            include: [
                {
                    model: Organizations,
                    include: [
                        {
                            model: User,
                            where: {
                                role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                            },
                            attributes: ['id', 'unique_id'],
                            include: [
                                {
                                    model: UserGithubDetails,
                                    attributes: ['username'],
                                },
                            ],
                        },
                    ],
                    attributes: ['id', 'name', 'blockchain_name'],
                },
            ],
        })
        const host_org_user_id = hostOrgData.organization.users[0].unique_id

        if (SmartContractDetailsData.smart_contract_github_accesses && hostOrgData) {
            const promises = SmartContractDetailsData.smart_contract_github_accesses.map(async (access_data) => {
                let access_status = 'PENDING'
                if (access_data.organization.users[0].user_github_detail) {
                    const gitHubUsername = access_data.organization.users[0].user_github_detail.username
                    const channelGitHubDetailsData = await SmartContractProposalChannel.findOne({
                        where: {
                            proposal_name: proposalName,
                        },
                        include: [
                            {
                                model: ChannelGitHubDetails,
                            },
                        ],
                    })
                    const repoDetails = channelGitHubDetailsData.channel_github_detail

                    if (access_data.status == 'PENDING') {
                        const invitations_arr = []
                        //Check user's invites
                        const API_PATH = `user/repository_invitations`
                        const options = {
                            userName: access_data.organization.users[0].unique_id,
                        }
                        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
                        if (response.status == 401) {
                            access_status = 'REJECTED'
                        } else {
                            for (const invitation of response) {
                                invitations_arr.push(invitation.id)
                            }
                            if (invitations_arr.indexOf(parseInt(access_data.invitation_id)) < 0) {
                                access_status = 'REJECTED'
                            }
                        }
                    }

                    // Call github API to check access status
                    const API_PATH = `repos/${repoDetails.repository_owner}/${repoDetails.repository_name}/collaborators/${gitHubUsername}`
                    const options = {
                        userName: host_org_user_id,
                    }
                    const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)
                    if (response.success) {
                        access_status = 'ACCEPTED'
                    } else if (access_data.status == 'REJECTED') {
                        access_status = 'REJECTED'
                    } else if (access_data.status == 'REQUESTED') {
                        access_status = 'REQUESTED'
                    } else if (response.status == 404 && access_data.status == 'ACCEPTED') {
                        // If user is removed directly from github.com
                        access_status = 'REJECTED'
                    }
                    console.log(response, API_PATH, access_data.organization_id, access_data.channel_id, access_status)
                    await SmartContractGithubAccess.update(
                        {
                            status: access_status,
                        },
                        {
                            where: {
                                organization_id: access_data.organization_id,
                                channel_id: access_data.channel_id,
                            },
                        },
                    )
                }
            })
            await Promise.all(promises)
            res.json({ success: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// APIs only accessible internally
router.use(userAuth)

module.exports = router
