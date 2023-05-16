/*############# IPFS NETWORK APIS ############*/

//Get access
const getAccess = async (user) => {
    try {
        //Get access token
        const headers = {
            'Content-type': 'application/json; charset=UTF-8',
        }
        const authResponse = await fetch(
            // process.env.OBORTECH_API + '/api/v1/auth/get-access',
            'https://ipfs.obortech.io/api/v1/auth/get-access',
            Object.assign(
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: JSON.stringify({ user_unique_id: user }),
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
        return { success: false, error: err.message || err.toString() }
    }
}

//Call IPFS network API
const callNetworkApi = async (accessToken, path, body = {}, isRelative = false) => {
    let errorMsg = ''
    let response = {}

    try {
        //Get access token
        const headers = {
            'Content-type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
        }

        const apiResponse = await fetch(
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

module.exports = {
    getAccess,
    callNetworkApi,
}
