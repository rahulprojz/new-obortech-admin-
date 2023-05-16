const { helperToConnectMongoDB } = require('./helpers/vault-helper')
const db = require('./models')

const User = db.users

function routesWithSlug({ server, app }) {
    // Auth Routes
    server.get('/verify-email/:token', async (req, res) => {
        const { token } = req.params
        const verified = await User.verify({ token })
        helperToConnectMongoDB(req)
        app.render(req, res, '/verify-email', { verified })
    })

    server.get('/reset-password/:token', (req, res) => {
        const { token } = req.params
        helperToConnectMongoDB(req)
        app.render(req, res, '/reset-password', { token })
    })

    // User Route
    server.get('/user/edit/:id', (req, res) => {
        helperToConnectMongoDB(req)
        app.render(req, res, '/user/edit', req.params)
    })

    // Admin Routes
    server.get('/admin/edit/:id', (req, res) => {
        helperToConnectMongoDB(req)
        app.render(req, res, '/admin/edit', req.params)
    })

    // Project Events Routes
    server.get('/event/:project_id', (req, res) => {
        const params = Object.assign(req.params, req.query)
        helperToConnectMongoDB(req)

        app.render(req, res, '/allevent', params)
    })

    // Project Documents Routes
    server.get('/document/:project_id', (req, res) => {
        const params = Object.assign(req.params, req.query)
        helperToConnectMongoDB(req)

        app.render(req, res, '/alldocument', params)
    })

    // Project Routes
    server.get('/iot/:project_id', (req, res) => {
        const params = Object.assign(req.params, req.query)
        helperToConnectMongoDB(req)

        app.render(req, res, '/iot', params)
    })

    // Analytics Route
    server.get('/analytics/:project_id/:item_id/:device_id', (req, res) => {
        const params = Object.assign(req.params, req.query)
        helperToConnectMongoDB(req)

        app.render(req, res, '/allanalytics', params)
    })

    // Add Organization
    server.get('/add-organization/:verification', (req, res) => {
        const { verification } = req.params
        helperToConnectMongoDB(req)

        app.render(req, res, '/add-organization', {
            verification,
        })
    })

    // Add Invited User
    server.get('/login/:signupverification', (req, res) => {
        const { verification } = req.params
        helperToConnectMongoDB(req)
        app.render(req, res, '/login', {
            verification,
        })
    })
}

module.exports = routesWithSlug
