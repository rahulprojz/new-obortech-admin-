const db = require('../models')

const User = db.users
const Role = db.roles
const Organization = db.organizations
const ApprovedBy = db.approved_by
const networkHooks = require('../hooks/network-hooks')

// Add user to Network
const addUserToNetwork = async (user_id) => {
    try {
        const userObj = await User.findOne({
            attributes: ['first_name', 'last_name', 'email', 'mobile', 'unique_id', 'password', 'organization_id'],
            include: [
                {
                    attributes: ['id', 'blockchain_name', 'msp_type'],
                    model: Organization,
                },
                {
                    model: Role,
                    attributes: ['id', 'name'],
                },
            ],
            where: { id: user_id, isDeleted: 0 },
        })

        if (userObj) {
            const user_Uniq_id = userObj.unique_id.toLowerCase()

            // Get admin user to authenticate
            const adminUser = await User.findOne({
                include: {
                    attributes: ['id', 'blockchain_name'],
                    model: Organization,
                    where: { isDeleted: 0 },
                },
                where: { id: 1, isDeleted: 0 },
            })

            let registerApiResp = ''
            const org_name = userObj.organization.blockchain_name
            if (userObj.organization.msp_type == 1) {
                const requestBody = {
                    orgName: adminUser.organization.blockchain_name,
                    userName: adminUser.unique_id,
                    userObj: {
                        orgName: org_name,
                        userName: user_Uniq_id,
                        password: userObj.password,
                        userRole: networkHooks.sanitize(userObj.role.name),
                    },
                }
                registerApiResp = await networkHooks.callNetworkApi('auth/register', 'POST', requestBody, 'DEFAULT')
            } else {
                const requestBody = {
                    orgName: org_name,
                    peerId: user_Uniq_id,
                }
                registerApiResp = await _callApi('api/registerUserInVault', requestBody, 'onboarding', accessToken)
            }

            //Don't add user details in IPFS if PUBLIC USER
            if (userObj.role_id == process.env.ROLE_PUBLIC_USER) {
                return false
            }

            //Store data on IPFS
            const requestBody = {
                orgName: userObj.organization.blockchain_name,
                userName: userObj.unique_id,
                firstName: userObj.first_name,
                lastName: userObj.last_name,
                userId: user_Uniq_id,
                email: userObj.email,
                phoneNumber: userObj.mobile,
            }
            const ipfsResponse = await networkHooks.callNetworkApi('user/add-details', 'POST', requestBody, 'IPFS')
            if (!ipfsResponse.success) {
                throw ipfsResponse
            }

            //Get controller
            const controllerReqObj = {
                orgName: 'obortech',
                userName: 'oboadmin',
            }
            const controllerResponse = await networkHooks.callNetworkApi('user/get-controller', 'POST', controllerReqObj, 'IPFS')
            if (!controllerResponse.success) {
                throw controllerResponse
            }

            const userBodyObj = {
                orgName: userObj.organization.blockchain_name,
                userName: user_Uniq_id,
                ipfsHash: ipfsResponse.data.data,
                controllerid: {
                    pubKey: controllerResponse.data.data.controllerID,
                    permissions: ['saveuserdata'],
                    policy: ['saveuserdata'],
                    accessLogID: '',
                },
                policy: ['kyc', 'contact', 'notification', 'editrequest', 'erasure'],
            }
            const processorResponse = await networkHooks.callNetworkApi('user/create-oborid', 'POST', userBodyObj, 'IPFS')
            if (!processorResponse.success) {
                throw processorResponse
            }

            //Login to explorer
            const loginBody = {
                user: 'exploreradmin',
                password: 'exploreradminpw',
                network: process.env.NETWORK_NAME,
            }

            const response = await _callApi('auth/login', loginBody, 'explorer')
            if (response) {
                //Register to explorer
                const registerBody = {
                    user: user_Uniq_id,
                    password: 'exploreradminpw',
                    roles: 'admin',
                }
                await _callApi('api/register', registerBody, 'explorer', response.token)
            }

            //Update user in DB
            await User.update({ added_to_network: 1 }, { where: { id: user_id, isDeleted: 0 } })

            return registerApiResp
        }
    } catch (err) {
        console.log(err)
    }
}

//Call API
const _callApi = async (path, body, type, token = false) => {
    try {
        const headers = {
            'Content-type': 'application/json; charset=UTF-8',
        }
        if (token) {
            headers.Authorization = 'Bearer ' + token
        }

        let API_URL = process.env.OBORTECH_API + '/api/v1'
        if (type == 'network') {
            API_URL = process.env.OBORTECH_API
        }
        if (type == 'explorer') {
            API_URL = process.env.EXPLORER_URL
        }
        if (type == 'onboarding') {
            API_URL = process.env.ONBOARDING_API_URL
        }

        const API_PATH = API_URL + '/' + path
        console.log('API_PATH -- ', API_PATH, JSON.stringify(body), headers)
        const response = await fetch(API_PATH, Object.assign({ method: 'POST', credentials: 'same-origin', body: JSON.stringify(body) }, { headers }))

        const data = await response.json()
        if (data.error) {
            console.log('Error From Network API', data.error)
            return false
        }
        console.log('_callApi', data)
        return data
    } catch (err) {
        console.log(err)
        return false
    }
}

//Get organization name
const getUniqId = async (organization_id) => {
    let uniqueId = ''
    const organization = await Organization.findOne({ where: { id: parseInt(organization_id), isDeleted: 0 } })
    if (organization) {
        const currentTimeStamp = Date.now().toString().slice(-4)
        const orgName = organization.name.toLowerCase().replace(/[^A-Za-z0-9]/g, '')
        uniqueId = orgName.substring(0, 3) + currentTimeStamp
    }
    return uniqueId
}

// Generate unique id for organization
const getOrgUniqId = (orgName) => {
    let charPart = ''
    for (let i = 0; i < 3; i++) {
        charPart += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26))
    }
    return `${orgName.substring(0, 3)}${charPart}${Math.floor(Math.random() * (999 - 100 + 1) + 100)}`
}

const updateApprovedOrg = async (where, userInfo, isVerified) => {
    await ApprovedBy.update({ isVerified }, { where })
    const isApproveAvailable = await ApprovedBy.count({
        where: { organization_id: userInfo.organization_id, isVerified: true },
    })
    await User.update({ status: !!isApproveAvailable }, { where: { id: userInfo.id, isDeleted: 0 } })
}

exports.addUserToNetwork = addUserToNetwork
exports.getUniqId = getUniqId
exports.getOrgUniqId = getOrgUniqId
exports.updateApprovedOrg = updateApprovedOrg
// eslint-disable-next-line no-underscore-dangle
exports.callAPI = _callApi
