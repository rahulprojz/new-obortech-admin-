const string = require('../helpers/LanguageHelper')

const userAuth = async (req, res, next) => {
    //check whether the request is internal or external
    if (!req.user) {
        return res.status(401).send({ status: 401, message: string.middlewares.unauthorizedUser })
    }
    return next()
}

module.exports = userAuth
