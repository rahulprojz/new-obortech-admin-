const logger = require('../logs')

const fetchDBCredFromVault = async (orgName) => {
    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
        const myHeaders = new Headers()
        myHeaders.append('X-Vault-Token', `${process.env.MULTIDB_VAULT_TOKEN}`)
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow',
        }
        const API_BASE_URL = `${process.env.MULTIDB_VAULT_URL}/v1/db_credentials/${orgName.toLowerCase()}`
        const response = await fetch(`${API_BASE_URL}`, requestOptions)
        const res = await response.json()
        return res.data
    } catch (err) {
        logger.error(err)
    }
    return null
}

const storeDBCredInVault = async (orgName, data) => {
    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
        const myHeaders = new Headers()
        myHeaders.append('X-Vault-Token', `${process.env.MULTIDB_VAULT_TOKEN}`)
        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            redirect: 'follow',
            body: data,
        }
        const API_BASE_URL = `${process.env.MULTIDB_VAULT_URL}/v1/db_credentials/${orgName}`
        const response = await fetch(`${API_BASE_URL}`, requestOptions)
        const res = await response.json()
        return res
    } catch (err) {
        logger.error(err)
    }
    return null
}

module.exports = {
    fetchDBCredFromVault,
    storeDBCredInVault,
}
