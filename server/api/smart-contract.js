// Load dependencies
const express = require('express')
const networkHooks = require('../hooks/network-hooks')
const string = require('../helpers/LanguageHelper')
// Load MySQL Models
const db = require('../models')
const { json } = require('body-parser')
const { async } = require('q')
const { sendGitHubAccessEmail } = require('../utils/emailHelpers')
const SmartContractGithubAccess = db.smart_contract_github_access
const Orgnizations = db.organizations
const Users = db.users
const UserGithubDetails = db.user_github_details
const ChannelGitHubDetails = db.channel_github_details
const SmartContractProposalChannels = db.smart_contract_proposal_channel
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const BASE_URL = 'governance'

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// get all proposals
router.get('/', async (req, res) => {
    try {
        const { userName, orgName, page_size, bookmark } = req.query
        const body = {
            userName,
            orgName,
            page_size,
            bookmark,
        }

        const response = await networkHooks.callNetworkApi(`${BASE_URL}`, 'GET', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// Add new proposals
router.post('/', async (req, res) => {
    try {
        let response = {
            success: false,
            message: 'Something went wrong',
        }
        const body = {
            userName: req.body.userName,
            orgName: req.body.orgName,
            name: req.body.name,
            description: req.body.description,
            token: req.body.token,
            package_id: req.body.package_id,
            github_commit_address: req.body.github_commit_address,
        }
        // Map new proposal with channel
        // Mapping proposals statically to 'obortech' channel for now
        // Get channel details (id) by using channel name
        const channel_name = 'obortech'
        const getChannelData = await ChannelGitHubDetails.findOne({
            where: {
                channel_name,
            },
        })
        const channelDetails = getChannelData.dataValues
        const channel_id = channelDetails.id
        const host_organization_id = channelDetails.host_organization
        const repo_name = channelDetails.repository_name
        const repo_owner = channelDetails.repository_owner

        // Add data to smart_contract_proposal_channels table
        await SmartContractProposalChannels.findOrCreate({
            where: {
                proposal_name: req.body.name,
            },
            defaults: {
                channel_id,
                proposal_name: req.body.name,
            },
        })

        // Get all member organizations and send github repo invitation
        const API_PATH = '/getMemberOrgs/' + channel_name
        const options = {
            token: req.body.token,
        }
        const memberOrgs = await networkHooks.callNetworkApi(`${API_PATH}`, 'GET', null, 'ONBOARDING', false, options)
        const HostGitUser = await UserGithubDetails.findByPk(1)

        if (memberOrgs.success) {
            memberOrgs.data.map(async (org) => {
                if (networkHooks.sanitize(org) != 'subscribersorg') {
                    // Get github access token of the user of CEO user type for each organization
                    const orgnizationDetails = await Orgnizations.findOne({
                        // removing spaces and lowercase orgname column value
                        where: Sequelize.where(Sequelize.fn('replace', Sequelize.fn('replace', Sequelize.col('blockchain_name'), ' ', ''), '.', ''), networkHooks.sanitize(org)),
                        /*  where: {
                         name: org
                     }, */
                        attributes: ['id', 'name'],
                    })

                    const UserGithubDetail = await UserGithubDetails.findOne({
                        include: [
                            {
                                model: Users,
                                where: {
                                    role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                    organization_id: orgnizationDetails.id,
                                },
                                attributes: ['id', 'unique_id', 'organization_id', 'role_id', 'first_name', 'last_name', 'email', 'language'],
                            },
                        ],
                        attributes: ['username'],
                    })

                    if (UserGithubDetail) {
                        let access_status = 'PENDING'
                        let invitationId

                        // Call github API to check access status
                        const API_PATH = `repos/${HostGitUser.username}/${repo_name}/collaborators/${UserGithubDetail.username}`
                        const options = {
                            userName: req.user.unique_id,
                            gitHubToken: HostGitUser.token,
                        }
                        const response = await networkHooks.callNetworkApi(API_PATH, 'GET', null, 'GITHUB', false, options)

                        if (response.success) {
                            access_status = 'ACCEPTED'
                        } else {
                            // get host organization user id
                            const hostOrgUserDetails = await Users.findOne({
                                where: {
                                    role_id: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER],
                                    organization_id: host_organization_id,
                                },
                                include: [
                                    {
                                        model: Orgnizations,
                                        attributes: ['id', 'name'],
                                    },
                                ],
                                attributes: ['id', 'unique_id', 'organization_id', 'role_id'],
                            })
                            const hostOptions = {
                                userName: hostOrgUserDetails.unique_id,
                                gitHubToken: HostGitUser.token,
                            }
                            // send invite to organization's CEO by calling GitHub API
                            const API_PATH = `repos/${HostGitUser.username}/${repo_name}/collaborators/${UserGithubDetail.username}`

                            const response = await networkHooks.callNetworkApi(API_PATH, 'PUT', req.body, 'GITHUB', false, hostOptions)
                            if (response) {
                                invitationId = response.id
                                await sendGitHubAccessEmail(UserGithubDetail.user.email, UserGithubDetail.user.first_name, UserGithubDetail.user.last_name, hostOrgUserDetails.organization.name, 'INVITATION', UserGithubDetail.user.language, req.body.name)
                            }
                        }

                        const SmartContractGithubAccessData = await SmartContractGithubAccess.findOne({
                            where: {
                                organization_id: UserGithubDetail.user.organization_id,
                                channel_id,
                            },
                        })
                        if (SmartContractGithubAccessData) {
                            // Update only if status is not accepted
                            if (SmartContractGithubAccessData.status != 'ACCEPTED') {
                                await SmartContractGithubAccessData.update({ organization_id: UserGithubDetail.user.organization_id, channel_id, invitation_id: invitationId, status: access_status })
                            }
                        } else {
                            if (UserGithubDetail.user.organization_id == host_organization_id) {
                                access_status = 'ACCEPTED'
                            }
                            await SmartContractGithubAccess.create({ organization_id: UserGithubDetail.user.organization_id, channel_id, invitation_id: invitationId, status: access_status })
                        }
                    } else {
                        await SmartContractGithubAccess.findOrCreate({
                            where: {
                                organization_id: orgnizationDetails.id,
                                channel_id,
                            },
                            defaults: {
                                organization_id: orgnizationDetails.id,
                                channel_id,
                                status: 'REJECTED',
                            },
                        })
                    }
                }
            })
        }

        // Add new smart contract
        response = await networkHooks.callNetworkApi(`${BASE_URL}`, 'POST', body, 'DEFAULT')
        res.json(response)
        /* res.json({
            success: true
        }) */
    } catch (err) {
        console.log(err)
        res.json({
            error: err.message || err.toString(),
        })
    }
})
// get approvals by name
router.get('/approve/:name', async (req, res) => {
    try {
        const { userName, orgName, version } = req.query
        const body = {
            userName,
            orgName,
            version,
        }
        const name = req.params.name
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/approve/${name}`, 'GET', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// get approvals by name
router.get('/comment/:name', async (req, res) => {
    try {
        const { userName, orgName, version } = req.query
        const body = {
            userName,
            orgName,
            version,
        }
        const name = req.params.name
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/comment/${name}`, 'GET', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// Add comment
router.post('/comment', async (req, res) => {
    console.log('payload3', req.body)
    try {
        const { userName, orgName, name, version, comment } = req.body
        const body = {
            userName,
            orgName,
            name,
            version,
            comment,
        }
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/comment`, 'POST', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// approve proposal
router.post('/approve', async (req, res) => {
    try {
        const { userName, orgName, name, version, description } = req.body
        const body = {
            userName,
            orgName,
            name,
            version,
            description,
        }
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/approve`, 'POST', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// cancel proposal
router.patch('/cancel', async (req, res) => {
    try {
        const { userName, orgName, id } = req.body
        const body = {
            userName,
            orgName,
            id,
        }
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/cancel`, 'PATCH', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

// Commit proposal
router.post('/commit', async (req, res) => {
    try {
        const { userName, orgName, name, version } = req.body
        const body = {
            userName,
            orgName,
            name,
            version,
        }
        const response = await networkHooks.callNetworkApi(`${BASE_URL}/commit`, 'POST', body, 'DEFAULT')
        res.json(response)
    } catch (err) {
        res.json({
            error: err.message || err.toString(),
        })
    }
})

module.exports = router
