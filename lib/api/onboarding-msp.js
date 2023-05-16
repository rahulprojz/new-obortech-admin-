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

/*#### ONBOARDING WITH FABRIC MSP ####*/
export const deployICA = (data, token) =>
    sendRequest(`deployICA`, token, {
        body: JSON.stringify(data),
    })

export const getOrgMSPCrypto = (data, token) =>
    sendRequest(`getOrgMSPCrypto`, token, {
        body: JSON.stringify(data),
    })

export const addOrgToChannel = (data, token) =>
    sendRequest(`addOrgToChannel`, token, {
        body: JSON.stringify(data),
    })

export const registerPeer = (data, token) =>
    sendRequest(`registerPeer`, token, {
        body: JSON.stringify(data),
    })

export const deployPeer = (data, token) =>
    sendRequest(`deployPeer`, token, {
        body: JSON.stringify(data),
    })

export const joinChannel = (data, token) =>
    sendRequest(`joinChannel`, token, {
        body: JSON.stringify(data),
    })

export const installChaincode = (data, token) =>
    sendRequest(`installChaincode`, token, {
        body: JSON.stringify(data),
    })

export const addCronForSyncUpdate = async (data, msp_type, token) => {
    return sendRequest(msp_type == 1 ? `addCronForSyncUpdate` : `vaultmsp/addCronForSyncUpdate`, token, {
        body: JSON.stringify(data),
    })
}

export const removeOrgFromAllPDC = (data, token) =>
    sendRequest(`v2/removeOrgFromAllPDC`, token, {
        body: JSON.stringify(data),
    })

export const removeOrgFromChannel = (data, token) =>
    sendRequest(`removeOrgFromChannel`, token, {
        body: JSON.stringify(data),
    })

/*#### ONBOARDING WITH VAULT MSP ####*/
export const createVaultICA = (data, token) =>
    sendRequest(`createVaultICA`, token, {
        body: JSON.stringify(data),
    })

export const getMSPCryptoFromVault = (data, token) =>
    sendRequest(`getMSPCryptoFromVault`, token, {
        body: JSON.stringify(data),
    })

export const registerPeerInVault = (data, token) =>
    sendRequest(`registerPeerInVault`, token, {
        body: JSON.stringify(data),
    })

export const deployPeerWithVaultMSP = (data, token) =>
    sendRequest(`deployPeerWithVaultMSP`, token, {
        body: JSON.stringify(data),
    })
