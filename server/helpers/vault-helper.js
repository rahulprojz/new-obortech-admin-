const mongoose = require('mongoose')
const vaultHook = require('../hooks/vault-hook')
const logger = require('../logs')

let connectedDBs = {}

const setConnectionDB = (obj = connectedDBs) => {
    connectedDBs = obj
}

const connectToMongoDB = async (orgName) => {
    return await new Promise(async (resolve, reject) => {
        try {
            const conn = connectedDBs[orgName]
            if ((!conn || (conn && mongoose.STATES[conn.readyState] !== 'connected')) && orgName) {
                if (orgName && !connectedDBs[orgName]) {
                    connectedDBs[orgName] = true
                    setConnectionDB(connectedDBs)
                }
                const dbCred = await vaultHook.fetchDBCredFromVault(orgName)
                const mongoUrl = `mongodb+srv://${dbCred.USER}:${dbCred.PASSWORD}@${dbCred.HOST}/${dbCred.DB}?retryWrites=true&w=majority`
                logger.info('connection url -- >   ', mongoUrl)

                const connection = await mongoose.createConnection(mongoUrl, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                })

                connection.set('bufferCommands', false)
                connection.once('open', function callback() {
                    logger.info('Mongo DB connection opened.')
                    resolve(true)
                })
                if (connection && orgName && (!connectedDBs[orgName] || connectedDBs[orgName] === true)) {
                    connectedDBs[orgName] = connection
                    setConnectionDB(connectedDBs)
                }
            } else {
                resolve(true)
            }
        } catch (err) {
            console.log(err)
            logger.error(err)
            reject(false)
        }
    })
}

const getConnectedDB = async (key) => {
    if (connectedDBs[key]) {
        return connectedDBs[key]
    } else {
        if (key || !connectedDBs[process.env.HOST_ORG]) await connectToMongoDB(key)
        return connectedDBs[key]
    }
}

const helperToConnectMongoDB = async (req) => {
    if (req.user) {
        const orgName = req.user.organization.blockchain_name
        await connectToMongoDB(orgName)
    }
}

module.exports = {
    connectToMongoDB,
    setConnectionDB,
    getConnectedDB,
    helperToConnectMongoDB,
}
