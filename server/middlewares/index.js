const hostAuth = require('./hostAuth')
const userAuth = require('./userAuth')
const jwtAuth = require('./jwtAuth')

const middlewares = {}

middlewares.hostAuth = hostAuth;
middlewares.userAuth = userAuth;
middlewares.jwtAuth = jwtAuth;

module.exports = middlewares;