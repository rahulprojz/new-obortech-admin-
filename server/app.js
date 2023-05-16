const express = require('express')
const session = require('express-session')
const compression = require('compression')
const mysqlSessionStore = require('express-mysql-session')
const next = require('next')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const cors = require('cors')
const routesWithSlug = require('./routesWithSlug')
const routesWithCache = require('./routesWithCache')
const sitemapAndRobots = require('./sitemapAndRobots')
const auth = require('./google')
const api = require('./api')
const db = require('./models')
// const cronmanager = require('./cronmanager.js')
const logger = require('./logs')
require('./passportauth')
require('dotenv').config()
const { connectToMongoDB, setConnectionDB } = require('./helpers/vault-helper')

const dev = process.env.dev === 'true'
const { port } = process.env
const ROOT_URL = dev ? `http://localhost:${port}` : process.env.SITE_URL
const error = require('./middlewares/error')

const sessionSecret = process.env.SESSION_SECRET
const app = next({ dev })
const handle = app.getRequestHandler()
db.sequelize.sync()

app.prepare().then(async () => {
    const server = express()
    server.use(cors())

    server.use(helmet())
    server.use(compression())
    server.use(express.json({ limit: '500mb', extended: true }))
    server.use(bodyParser.json({ limit: '500mb' }))
    server.use(bodyParser.text({ limit: '500mb' }))
    server.use(bodyParser.urlencoded({ limit: '500mb', extended: true, parameterLimit: 50000 }))

    // Run Cron Jobs, Cron job will only run on local and crons server/pod
    if (process.env.SITE_URL.includes('cron') || process.env.SITE_URL.includes('local')) {
        // cronmanager.runCronJob()
        // cronmanager.checkExpiredInvitation()
    }

    // give all Nextjs's request to Nextjs server
    server.get('/_next/*', (req, res) => {
        handle(req, res)
    })

    server.get('/static/*', (req, res) => {
        handle(req, res)
    })

    const MysqlStore = mysqlSessionStore(session)
    const sess = {
        name: 'nextadmin.sid',
        secret: sessionSecret,
        store: new MysqlStore({
            host: process.env.DB_HOST,
            port: 3306,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        }),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000, // expires in 14 days
        },
    }

    server.use(session(sess))

    auth({ server, ROOT_URL })
    api(server)

    routesWithSlug({ server, app })
    routesWithCache({ server, app })
    sitemapAndRobots({ server })

    server.get('*', async (req, res, moveOn) => {
        if (req.user) {
            const orgName = req.user.organization.blockchain_name
            connectToMongoDB(orgName)
        }
        return moveOn()
    })

    setConnectionDB()

    server.get('/', (req, res) => {
        res.redirect(301, '/project')
    })

    /* Server app url to return image */
    server.get('/server/upload/:filename', (req, res) => {
        const fileUrl = req.url.split('?')[0]
        const pathurl = fileUrl
        const splitpath = pathurl.split('/')
        res.sendFile(`${__dirname}/${splitpath[2]}/${splitpath[3]}`)
    })

    /* Server app url to return image */
    server.get('/server/upload/user-agreement/:filename', (req, res) => {
        const fileUrl = req.url.split('?')[0]
        const pathurl = fileUrl
        const splitpath = pathurl.split('/')
        res.sendFile(`${__dirname}/${splitpath[2]}/${splitpath[3]}/${splitpath[4]}`)
    })
    // require('./routes')({ server, app })
    server.get('*', (req, res) => {
        handle(req, res)
    })

    // if error is not an instanceOf APIError, convert it.
    // server.use(error.converter)

    // catch 404 and forward to error handler
    server.use(error.notFound)

    // error handler, send stacktrace only during development
    server.use(error.handler)


    server.listen(port, async (err) => {
        if (err) throw err
        logger.info(`> Ready on ${ROOT_URL}`)
    })
})
