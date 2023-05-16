/*############# IPFS NETWORK APIS ############*/

const axios = require('axios')

export const getAccess = async (user_id, org_name) => {
    try {
        //Get access token
        const headers = {
            'Content-type': 'application/json; charset=UTF-8',
        }
        const authResponse = await fetch(
            process.env.OBORTECH_API + '/api/v1/auth/get-access',
            Object.assign(
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: JSON.stringify({ user_unique_id: user_id.toLowerCase(), org_name }),
                },
                { headers },
            ),
        )

        const accessData = await authResponse.json()
        if (!accessData.success) {
            throw accessData.error
        }

        return accessData.data
    } catch (err) {
        return { success: false, error: (err && (err.message || err.toString())) || '' }
    }
}

export const callNetworkApi = async (accessToken, path, body = {}, isRelative = false, headers = {}, method = 'POST') => {
    let errorMsg = ''
    try {
        //Get access token
        const headers = {
            'Content-type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
            ...headers,
        }
        let apiResponse

        if (method == 'GET') {
            apiResponse = await fetch(
                process.env.OBORTECH_API + `/api/v1/data-policy?purpose=${body.purpose}`,
                Object.assign(
                    {
                        method: 'GET',
                        credentials: 'same-origin',
                    },
                    { headers },
                ),
            )
        } else {
            apiResponse = await fetch(
                !isRelative ? process.env.OBORTECH_API + '/api/v1/user/' + path : process.env.OBORTECH_API + '/api/v1/' + path,
                Object.assign(
                    {
                        method: 'POST',
                        credentials: 'same-origin',
                        body: JSON.stringify(body),
                    },
                    { headers },
                ),
            )
        }
        const apiResponseData = await apiResponse.json()
        if (apiResponseData.error) {
            errorMsg = 'Error From Network API: ' + apiResponseData.error
        }

        if (!apiResponseData.success) {
            errorMsg = apiResponseData.message
        }

        if (errorMsg) {
            throw errorMsg
        }

        return { success: true, data: apiResponseData.data.data }
    } catch (err) {
        return { success: false, error: err.message || err.toString() }
    }
}

// Upload docments on IPFS network
export const uploadDocument = async (accessToken, formData) => {
    let errorMsg = ''
    try {
        //Get access token
        const headers = {
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer ' + accessToken,
        }

        const apiResponseData = await axios.post(`${process.env.OBORTECH_API}/api/v1/document/add`, formData, { headers })
        if (apiResponseData.error) {
            errorMsg = 'Error From Network API: ' + apiResponseData.error
        }

        if (!apiResponseData.success) {
            errorMsg = apiResponseData.message
        }

        if (errorMsg) {
            throw errorMsg
        }

        return { success: true, data: apiResponseData.data.data }
    } catch (err) {
        return { success: false, error: err.message || err.toString() }
    }
}

export const fetchDocument = async (accessToken, documentHash) => {
    let errorMsg = ''
    try {
        // Get access token
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        }

        const apiResponseData = await axios({
            url: `${process.env.OBORTECH_API}/api/v1/document/${documentHash}`,
            responseType: 'arraybuffer',
            responseEncoding: 'binary',
            headers,
        })

        if (apiResponseData.error) {
            errorMsg = `Error From Network API: ${apiResponseData.error}`
        }

        if (!apiResponseData.success) {
            errorMsg = apiResponseData.message
        }

        if (errorMsg) {
            throw errorMsg
        }

        return { success: true, data: apiResponseData.data }
    } catch (err) {
        return { success: false, error: err.message || err.toString() }
    }
}
