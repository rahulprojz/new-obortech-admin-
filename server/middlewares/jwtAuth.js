const { verifyExternalApi } = require('../helpers/jwt-token')
const db = require('../models')
const User = db.users
const Organization = db.organizations
const string = require('../helpers/LanguageHelper')
const { getAccess } = require('../hooks/network-hooks')

const jwtAuth = async (req, res, next) => {
    try {
        const token = req.headers['authorization']
        const options = {
            issuer: 'Obortech Blockchain',
            subject: 'admin@obortech.io',
            audience: 'https://www.obortech.io/',
        }

        if (req.isInternal) {
            return next()
        }
        if (token) {
            const decoded = verifyExternalApi(token.replace(/^Bearer\s/, ''), options, 'external')
            if (decoded) {
                const userModel = await User.findOne({
                    where: {
                        unique_id: decoded.uniqueId,
                        isDeleted: 0,
                    },
                    include: {
                        model: Organization,
                        where: { isDeleted: 0 },
                    },
                })
                if (userModel) {
                    req.user = userModel
                    req.isExternal = true
                    return next()
                }
                return res.status(401).send({ status: 401, message: string.middlewares.invalidAccessToken })
            } else {
                //JWT is not valid now check and match APIkey from vault
                let orgName
                let userName

                //Checking orgName and userName in body in case of post requests and in query params in case of GET requests
                if (req.method == 'GET' && req.query['orgName'] && req.query['userName']) {
                    orgName = req.query['orgName']
                    userName = req.query['userName']
                } else if (req.body.orgName && req.body.userName) {
                    orgName = req.body.orgName
                    userName = req.body.userName
                }

                orgName = req.headers.orgname ? req.headers.orgname : orgName
                userName = req.headers.username ? req.headers.username : userName

                try {
                    const userApiKey = await getAccess(userName, orgName)
                    if (!userApiKey) {
                        return res.status(401).send({ status: 401, message: string.middlewares.unauthorizedUser })
                    }

                    if (token == userApiKey) {
                        const userModel = await User.findOne({
                            where: {
                                unique_id: userName,
                                isDeleted: 0,
                            },
                            include: {
                                model: Organization,
                                where: { isDeleted: 0 },
                            },
                        })

                        if (userModel) {
                            req.user = userModel
                            req.isExternal = true
                            return next()
                        }
                    }
                } catch (error) {
                    return res.status(401).send({ status: 401, message: string.middlewares.unauthorizedUser })
                }
            }

            return res.status(401).send({ status: 401, message: string.middlewares.invalidAccessToken })
        }

        return res.status(401).send({ status: 401, message: string.middlewares.unauthorizedUser })
    } catch (error) {
        console.log(error)
    }
}

module.exports = jwtAuth
