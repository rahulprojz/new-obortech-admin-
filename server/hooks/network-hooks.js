const db = require('../models')
const Event = db.events
const Station = db.stations
const User = db.users
const Organization = db.organizations
const UserGithubDetails = db.user_github_details

let isUnderProcess = false
let processCounts = 0
let currentProcessRunning = 0

// Generate uniq id
const _generateUniqId = () => {
    const uniqId = Math.random().toString(36).substr(2, 9)
    return uniqId.toLowerCase().toString()
}

const sanitize = (string) => {
    return string
        ? string
              .toString()
              .replace(/[^a-zA-Z]/g, '')
              .toLowerCase()
        : ''
}

// Get event name
const _getEventName = async (event_id, station_id = null, flag = null) => {
    try {
        let eventName = ''
        const event = await Event.findOne({ where: { uniqId: event_id } })
        if (event) {
            eventName = event.eventName
            if (station_id) {
                const station = await Station.findByPk(parseInt(station_id))
                eventName = event.eventName + ': ' + station.name
            }

            // If document accepted event
            if (flag == 'accepted') {
                eventName += ' accepted'
            }
            if (flag == 'all_accepted') {
                eventName = `All accepted ${eventName}`
            }
            if (flag == 'rejected') {
                eventName += ' rejected'
            }
            if (flag == 'all_rejected') {
                eventName = `All rejected ${eventName}`
            }
        }

        return eventName
    } catch (error) {
        throw error
    }
}

const getAccess = async (user_id, orgName) => {
    try {
        if (!user_id && !orgName) {
            return false
        }

        // Get access token
        const headers = {
            'Content-type': 'application/json; charset=UTF-8',
        }
        const authResponse = await fetch(
            `${process.env.OBORTECH_API}/api/v1/account/apikey`,
            Object.assign(
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: JSON.stringify({ userName: user_id.toLowerCase(), orgName }),
                },
                { headers },
            ),
        )

        const accessData = await authResponse.json()
        if (!accessData.success) {
            console.log(accessData.error)
            return false
        }
        return accessData.apiKey
    } catch (err) {
        console.log(err)
        return false
    }
}

const getGitHubAccessToken = async (username) => {
    try {
        const UserGithubDetail = await UserGithubDetails.findOne({
            include: [
                {
                    model: User,
                    where: {
                        unique_id: username,
                    },
                },
            ],
            attributes: ['token'],
        })
        if (UserGithubDetail) {
            return 'token ' + UserGithubDetail.token
        }
        return
    } catch (err) {
        console.log(err)
        return false
    }
}

// Function call queue
const _apiLock = async (path, body) => {
    return await new Promise(async (resolve, reject) => {
        processCounts++
        const subProcessId = processCounts

        const interVal = setInterval(async () => {
            if (!isUnderProcess && subProcessId == currentProcessRunning + 1) {
                clearInterval(interVal)
                const result = await _callApi(path, body, subProcessId)
                isUnderProcess = false
                resolve(result)
            }
        }, 100)
    })
        .then((data) => {
            if (processCounts === currentProcessRunning) {
                processCounts = 0
                currentProcessRunning = 0
            }
            return data
        })
        .catch((data) => {
            if (processCounts === currentProcessRunning) {
                processCounts = 0
                currentProcessRunning = 0
            }
            return data
        })
}

// Call API
const _callApi = async (path, body, processId) => {
    try {
        let endpointURL = path
        isUnderProcess = true
        currentProcessRunning = processId

        // Get access token
        const apiKey = await getAccess(body.userName, body.orgName)
        if (!apiKey) {
            console.log('Access token not found')
            return false
        }

        const headers = {
            'Content-type': 'application/json',
            apikey: `${apiKey}`,
        }

        // For event submission we use GoLang SDK
        let API_BASE_URL = process.env.OBORTECH_API
        if (path == 'addEventSubmission') {
            API_BASE_URL = process.env.NETWORK_AWS_API_URL
            endpointURL = 'api/v1/events/submission'
        }

        const response = await fetch(`${API_BASE_URL}/${endpointURL}`, Object.assign({ method: 'POST', credentials: 'same-origin', body: JSON.stringify(body) }, { headers }))
        const apiResponse = await response.json()
        if (apiResponse.error) {
            console.log('apiResponse', apiResponse)
            return false
        }
        return apiResponse
    } catch (err) {
        console.log('callNetworkApi-Response err', err)
        return err
    }
}

// Call Network API
const callNetworkApi = async (path, method, body, host = 'IPFS', auth = true, options = {}) => {
    try {
        let headers = {
            'Content-type': 'application/json',
        }

        console.log(body)

        if (auth) {
            // Get API key
            const apiKey = await getAccess(body.userName, body.orgName)
            if (!apiKey) {
                console.log('Access token not found')
                return false
            }

            //Add apikey in headers inf Auth is enabled
            //We need to send username and orgname in headers for AWS Auth
            if (host == 'AWS') {
                headers.userName = body.userName
                headers.orgName = body.orgName
                headers.Authorization = apiKey
            } else {
                headers.apikey = apiKey
            }
        }
        if (host == 'GITHUB') {
            //Get GitHub username and access token
            if (options.gitHubToken) {
                headers.Authorization = 'token ' + options.gitHubToken
            } else {
                const gitHubToken = await getGitHubAccessToken(options.userName)
                headers.Authorization = gitHubToken
            }
        }
        if (host == 'ONBOARDING') {
            headers.Authorization = 'Bearer ' + options.token
        }

        // For event submission we use GoLang SDK
        let API_BASE_URL = await getBaseURL(host)
        let response = null

        console.log('callNetworkApi body', body)

        if (method == 'GET') {
            let query = ''
            for (const param in body) {
                query = `${query}${query ? '&' : '?'}${param}=${body[param]}`
            }
            response = await fetch(`${API_BASE_URL}/${path}${query}`, Object.assign({ method: method, credentials: 'same-origin' }, { headers }))
        } else {
            response = await fetch(`${API_BASE_URL}/${path}`, Object.assign({ method: method || 'POST', credentials: 'same-origin', body: JSON.stringify(body) }, { headers }))
        }

        if (response.status == 204) {
            return {
                status: 204,
                success: true,
            }
        }
        const apiResponse = await response.json()

        if (response.status == 404) {
            apiResponse.status = 404
        }
        if (response.status == 401) {
            apiResponse.status = 401
        }

        console.log('callNetworkApi apiResponse', `${API_BASE_URL}/${path}`, apiResponse)

        if (apiResponse.error) {
            return false
        }
        return apiResponse
    } catch (err) {
        console.log('callNetworkApi-Response err', err)
        return err
    }
}

// Call Internal API
const callInternalApi = async (path, method, body, auth = true, options = {}) => {
    try {
        let headers = {
            'Content-type': 'application/json',
        }
        if (auth) {
            // Get API key
            const apiKey = await getAccess(body.userName, body.orgName)
            if (!apiKey) {
                console.log('Access token not found')
                return false
            }

            headers.authorization = apiKey
        }

        let API_BASE_URL = process.env.SITE_URL + '/api/v1'
        let response = null

        if (method == 'GET') {
            let query = ''
            for (const param in body) {
                query = `${query}${query ? '&' : '?'}${param}=${body[param]}`
            }
            response = await fetch(`${API_BASE_URL}/${path}${query}`, Object.assign({ method: method, credentials: 'same-origin' }, { headers }))
        } else {
            response = await fetch(`${API_BASE_URL}/${path}`, Object.assign({ method: method || 'POST', credentials: 'same-origin', body: JSON.stringify(body) }, { headers }))
        }

        if (response.status == 204) {
            return {
                status: 204,
                success: true,
            }
        }
        const apiResponse = await response.json()

        if (response.status == 404) {
            apiResponse.status = 404
        }
        if (response.status == 401) {
            apiResponse.status = 401
        }

        console.log('callInternalApi apiResponse', `${API_BASE_URL}/${path}`, apiResponse)

        if (apiResponse.error) {
            return false
        }
        return apiResponse
    } catch (err) {
        console.log('callInternalApi-Response err', err)
        return err
    }
}

// Get API base url, Obortech API, Obortech IPFS, and AWS api Gateway
const getBaseURL = async (host) => {
    let apiBaseUrl = process.env.OBORTECH_API

    if (host == 'IPFS') {
        apiBaseUrl = process.env.OBORTECH_API + '/api/v1'
    }
    if (host == 'DEFAULT') {
        apiBaseUrl = process.env.OBORTECH_API + '/api/v1'
    }
    if (host == 'AWS') {
        apiBaseUrl = process.env.NETWORK_AWS_API_URL + '/api/v1'
    }
    if (host == 'GITHUB') {
        apiBaseUrl = process.env.GITHUB_API_URL
    }
    if (host == 'ONBOARDING') {
        apiBaseUrl = process.env.ONBOARDING_API_URL + '/api'
    }
    return apiBaseUrl
}

// Upload document API
const uploadDocument = async (path, req) => {
    try {
        // Get API key
        const apiKey = await getAccess(req.body.userName, req.body.orgName)
        if (!apiKey) {
            console.log('Access token not found')
        }
        const headers = {
            apikey: `${apiKey}`,
        }

        // For event submission we use GoLang SDK
        let API_BASE_URL = process.env.OBORTECH_API + '/api/v1'
        const response = await fetch(`${API_BASE_URL}/${path}`, { method: 'POST', headers, body: req })
        const apiResponse = await response.json()

        if (apiResponse.error) {
            return false
        }
        return apiResponse
    } catch (err) {
        console.log('callNetworkApi-Response err', err)
        return err
    }
}

// Use Obortech admin to upload document
// Because while registering user, we will be using Obortech admin only
const useAdminUser = async (req) => {
    const adminUser = await User.findOne({
        include: [{ model: Organization, where: { isDeleted: 0 } }],
        where: {
            organization_id: 1,
            role_id: process.env.ROLE_ADMIN,
            isDeleted: 0,
        },
        order: [['id', 'ASC']],
    })
    req.body.userName = adminUser.unique_id
    req.body.orgName = sanitize(adminUser.organization.name)

    return req
}

const sendAbsoluteRequest = async (path, opts = {}) => {
    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
    })

    const response = await fetch(`${path}`, Object.assign({ method: 'POST', credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()
    if (data && data.error) {
        console.log('sendAbsoluteRequest --> ', data.error)
    }

    return data
}

module.exports = {
    _generateUniqId,
    _getEventName,
    _apiLock,
    sanitize,
    callNetworkApi,
    useAdminUser,
    uploadDocument,
    getAccess,
    getGitHubAccessToken,
    callInternalApi,
    sendAbsoluteRequest,
}
