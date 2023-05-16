/*
    ADDING PARTICIPANT TO FABRIC NETWORK
*/
const BASE_URL = process.env.ONBOARDING_API_URL

async function sendRequest(path, token, body = {}) {
    const headers = {
        'Content-type': 'application/json; charset=UTF-8',
    }
    if (token) {
        headers.Authorization = 'Bearer ' + token
    }

    const response = await fetch(`${BASE_URL}/api/${path}`, Object.assign({ method: 'POST', credentials: 'same-origin' }, body, { headers }))
    const data = await response.json()
    if (data.error) {
        console.log('Error From API', data.error)
    }

    return data
}

/* PDC APIs */
export const createPdc = (data, type = 1, token) =>
    sendRequest(type == 1 ? `v2/createPDC` : `v2/vaultmsp/createPDC`, token, {
        body: JSON.stringify(data),
    })

export const updatePdc = (data, type = 1, token) =>
    sendRequest(type == 1 ? `v2/updateMemberInPDC` : `v2/vaultmsp/updateMemberInPDC`, token, {
        body: JSON.stringify(data),
    })

export const deletePdc = (data, type = 1, token) =>
    sendRequest(type == 1 ? `v2/deletePDC` : `v2/vaultmsp/deletePDC`, token, {
        body: JSON.stringify(data),
    })

export const createGlobalPDC = (data = 1, token) =>
    sendRequest('v2/createPDCandApproveByAll', token, {
        body: JSON.stringify(data),
    })

export const fetchPDCs = (chaincode, token) =>
    sendRequest(`v2/getPDCList/${chaincode}`, token, {
        method: 'GET',
    })
