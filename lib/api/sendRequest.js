import 'isomorphic-unfetch'
import { getRootUrl, getIpfsUrl, getNetworkUrl, getMVSUrl, getMVSAuthUrl } from './getRootUrl'

export default async function sendRequest(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
    })

    const response = await fetch(`${getRootUrl()}${path}`, Object.assign({ method: 'POST', credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()
    if (data?.error) {
        console.log(data.error)
    }

    return data
}

export const sendAbsoluteRequest = async (path, opts = {}) => {
    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
    })

    const response = await fetch(`${path}`, Object.assign({ method: 'POST', credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()
    if (data?.error) {
        console.log(data.error)
    }

    return data
}

export const sendNetworkRequest = async (path, opts = {}, networkType = 'DEFAULT', authToken = null, httpMethod = 'GET') => {
    //Get access token
    let accessToken = authToken
    //Validate the access token later
    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
        Authorization: `Bearer ${accessToken}`,
    })
    let baseNetworkURL = getNetworkUrl()
    switch (networkType) {
        case 'IPFS':
            baseNetworkURL = getIpfsUrl()
            break
        case 'AWS':
            baseNetworkURL = getAWSApiNetworkUrl()
            break
        case 'SERVER':
            baseNetworkURL = getRootUrl()
            break
        default:
            baseNetworkURL = getNetworkUrl()
            break
    }

    const response = await fetch(`${baseNetworkURL}${path}`, Object.assign({ method: httpMethod, credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()
    if (!data.success) {
        console.log(data.error)
    }
    return data
}

//for NFT
export const sendNetworkRequestNFT = async (path, opts = {}, networkType = 'DEFAULT', authToken = null, httpMethod = 'GET') => {
    //Get access token
    let accessToken = authToken
    //Validate the access token later

    const headers = Object.assign({}, opts.headers || {}, {
        Authorization: `Bearer ${accessToken}`,
    })

    let baseNetworkURL = getNetworkUrl()
    switch (networkType) {
        case 'IPFS':
            baseNetworkURL = getIpfsUrl()
            break
        case 'AWS':
            baseNetworkURL = getAWSApiNetworkUrl()
            break
        case 'SERVER':
            baseNetworkURL = getRootUrl()
            break
        default:
            baseNetworkURL = getNetworkUrl()
            break
    }

    const response = await fetch(`${baseNetworkURL}${path}`, Object.assign({ method: httpMethod, credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()
    if (!data.success) {
        console.log(data.error)
    }

    return { response, data }
}

// To send request for new url
export const sendNetworkRequestGet = async (path, opts = {}, isNetwork = false, authToken = null) => {
    //Get access token

    console.log({ authToken })
    const requestBody = JSON.parse(opts.body)
    const accessToken = authToken

    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
        Authorization: `Bearer ${accessToken}`,
    })

    const response = await fetch(`${isNetwork ? getNetworkUrl() : getIpfsUrl()}${path}`, Object.assign({ method: 'GET', credentials: 'same-origin' }, opts, { headers }))

    const data = await response.json()
    if (!data.success) {
        console.log(data.error)
    }

    return data
}

export const sendMVSRequest = async (path, opts = {}) => {
    const headers = Object.assign({}, opts.headers || {}, {
        'Content-type': 'application/json; charset=UTF-8',
    })
    const response = await fetch(`${getMVSUrl()}${path}`, Object.assign({ method: 'POST', credentials: 'same-origin' }, opts, { headers }))
    const data = await response.json()

    return data
}

export const getMVSToken = async () => {
    try {
        const headers = {
            Authorization: 'Basic ' + btoa('XU9uMX7WL97eqJA:XHB5Jpz7LXusfrRV'),
        }
        const authResponse = await fetch(
            process.env.MVS_URL + '/get/token',
            Object.assign(
                {
                    method: 'GET',
                },
                { headers },
            ),
        )
        const accessData = await authResponse.json()
        return accessData
    } catch (err) {
        console.log(err)
        return false
    }
}

export const verifyMangolianOrg = async (opts = {}, token) => {
    const response = await fetch(`${getMVSUrl()}/organizations/check-name`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: JSON.stringify(opts),
    })
    const data = await response.json()

    return data
}
