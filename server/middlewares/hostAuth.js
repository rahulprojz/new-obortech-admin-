const dev = process.env.dev == 'true'
const port = process.env.port
const ROOT_URL = dev ? `http://localhost:${port}` : process.env.SITE_URL
const string = require('../helpers/LanguageHelper')

const hostAuth = async (req, res, next) => {
    //check whether the request is internal or external
    const token = req.headers['authorization'];
    req.isInternal = false;
    if (!token && req.headers.referer) {
        //Check if request host is the internal host
        HOST_URL = ROOT_URL.replace(/(^\w+:|^)\/\//, '');
        let domain = (new URL(req.headers.referer));
        domain = domain.hostname.replace('www.', '');

        if (HOST_URL == domain + ":4000" || HOST_URL == domain) {
            req.isInternal = true;
            return next();
        }
        return res.status(401).send({ status: 403, message: string.middlewares.unauthorizedUser });
    }
    return next();

}

module.exports = hostAuth;