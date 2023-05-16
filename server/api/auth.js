// Load dependencies
const express = require('express')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const fs = require('fs')
const AWS = require('aws-sdk')
const md5 = require('md5')
const multipart = require('connect-multiparty')
const string = require('../helpers/LanguageHelper')
const statusCode = require('../../utils/statusCodes')
const cipher = require('../../utils/encrypt')
const emailSender = require('../services/sendMail')
const { prepareEmailBody } = require('../helpers/email-helper')
const { prepareEmailHtml } = require('../helpers/email-helper')
const otpHelper = require('../helpers/otp-helper.js')
const db = require('../models')
const axios = require('axios')

const User = db.users
const Session = db.sessions
const Organization = db.organizations
const Subscription = db.subscription
const UserSecurityAnswers = db.user_security_answers
const SecurityQuestions = db.security_questions
const EmailVerification = db.temp_email_verification
const { getLanguageJson } = require('../utils/globalHelpers')
const { connectToMongoDB } = require('../helpers/vault-helper')
const { signTempToken } = require('../helpers/jwt-token')
const networkHooks = require('../hooks/network-hooks')

// Define global variables
const logger = require('../logs')
const { async } = require('q')
const { request } = require('http')
const Op = db.Sequelize.Op

const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })
const router = express.Router()
const server = express()
const { CIPHER_SALT } = process.env
const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

const otpList = [{}]

router.post('/sendotp', async (req, res) => {
    try {
        const languageJson = await getLanguageJson(req.body.lang)

        // Create a save OTP
        let response
        const reqObj = {
            verificationCode: otpHelper._generateotp(),
            toNumber: req.body.number,
            countrycode: req.body.countrycode,
            lang: req.body.lang,
            msgBody: languageJson.verificationSMSBody,
        }

        // If request is sent from mobile app
        if (req.body.ismobile == 'true') {
            response = await otpHelper._sendOtpToMobile(reqObj)
        } else {
            response = await otpHelper._sendOtpToWeb(reqObj)
        }

        res.status(response.code).json(response.data)
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

router.post('/verifyotp', async (req, res) => {
    try {
        // Create a save OTP
        let response
        const reqObj = {
            verificationCode: req.body.otp,
            toNumber: req.body.number,
            countrycode: req.body.countrycode,
        }

        // If request is sent from mobile app
        if (req.body.ismobile == 'true') {
            response = await otpHelper._verifyMobileOtp(reqObj)
        } else {
            response = await otpHelper._verifyWebOtp(reqObj)
        }

        res.status(response.code).json(response.data)
    } catch (err) {
        res.status(500).json({
            code: 2,
            message: err.message || err.toString(),
        })
    }
})

router.get('/profile/:slug', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.slug, isDeleted: 0 })
        user.password = null
        res.json(user)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

//  Check user name already exist or not
router.post('/user-isvalid', async (req, res) => {
    try {
        const { name } = req.body
        const count = await User.count({ where: { username: name, isDeleted: 0 } })
        if (count) {
            res.status(200).json({ isExist: true })
        } else {
            res.status(200).json({ isExist: false })
        }
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

router.post('/profile', async (req, res) => {
    try {
        if (req.body.password) {
            const user = await User.findOneAndUpdate(
                { _id: req.body._id, isDeleted: 0 },
                {
                    $set: {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        phone: req.body.phone,
                        password: md5(req.body.password),
                    },
                },
            )
            user.password = null
            res.json(user)
        } else {
            const user = await User.findOneAndUpdate(
                { _id: req.body._id, isDeleted: 0 },
                {
                    $set: {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        phone: req.body.phone,
                    },
                },
            )
            user.password = null
            res.json(user)
        }
    } catch (err) {
        logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/uploadimage', multipartMiddleware, async (req, res) => {
    try {
        const userdetails = JSON.parse(req.body.user)
        const tmp_path = req.files.file.path
        await fs.readFile(tmp_path, async function (err, data) {
            const s3 = new AWS.S3({
                accessKeyId: process.env.Amazon_accessKeyId,
                secretAccessKey: process.env.Amazon_secretAccessKey,
                region: process.env.Amazon_region,
            })
            const params = {
                Bucket: 'obortech-data', // pass your bucket name
                Key: `profile_images/${userdetails._id}/${req.files.file.name}`, // file will be saved as testBucket/contacts.csv
                Body: data,
                ACL: 'public-read',
                ContentType: 'image/jpeg',
            }
            await s3.upload(params, async function (s3Err, data) {
                const response = {}
                const user = await User.findOneAndUpdate({ _id: userdetails._id }, { $set: { profile_pic: data.Location } }, { fields: 'profile_pic', new: true })
                response.image = data.Location
                res.json(response)
            })
        })
    } catch (err) {
        logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/forgotpassword', async (req, res) => {
    try {
        const { email, otp, passwordType } = req.body
        const user = await User.findOne({
            include: {
                attributes: ['id', 'blockchain_name'],
                model: Organization,
            },
            where: { email, isDeleted: 0 },
        })
        if (!user) {
            res.json({ userNotExists: true })
        } else {
            if (otp) {
                const reqObj = {
                    verificationCode: otp,
                    toNumber: user.mobile,
                    countrycode: user.country_code,
                }
                const response = await otpHelper._verifyWebOtp(reqObj)
                if (response.data.code !== 1) {
                    return res.json({ otpInvalid: true })
                }
            }
            const languageJson = await getLanguageJson(user.language)
            let htmlToSend = null
            if (passwordType == 'profile_password') {
                const code = JSON.stringify({
                    id: email,
                })
                // To create a cipher
                const encoder = cipher(CIPHER_SALT)

                const resetPasswordLink = `${SITE_URL}/reset-password?email=${encoder(code)}&lang=${user.language}`
                const replacements = {
                    userName: user.username,
                    resetPasswordLink,
                    email,
                    URL: SITE_URL,
                    hi: languageJson.emailContent.hi,
                    linkText: languageJson.emailContent.notSeeResetApproval,
                    clickToReset: languageJson.emailContent.clickToReset,
                    resetPassword: languageJson.emailContent.resetPassword,
                    oborInfo: languageJson.emailContent.oborInfo,
                }
                htmlToSend = prepareEmailBody('email', 'forgot-password', replacements)
            } else if (passwordType == 'transaction_password') {
                // Recover transaction password
                const requestBody = {
                    orgName: user.organization.blockchain_name,
                    userName: user.unique_id,
                    email: user.email,
                }
                const apiKey = await networkHooks.getAccess(user.unique_id, user.organization.blockchain_name)
                const config = {
                    method: 'post',
                    url: `${process.env.OBORTECH_API}/api/v1/account/transaction-password`,
                    headers: {
                        apikey: apiKey,
                        'Content-Type': 'application/json',
                    },
                    data: requestBody,
                }
                const response = await axios(config)
                if (response.data.success) {
                    const replacements = {
                        organization: user.organization.blockchain_name,
                        URL: process.env.SITE_URL,
                        passwordUpdateMessage: languageJson.emailContent.transactionPasswordUpdateMessage,
                        yourUsername: languageJson.emailContent.yourUsername,
                        userName: user.username,
                        hi: languageJson.emailContent.hi,
                        oborInfo: languageJson.emailContent.oborInfo,
                        yourTransactionPassword: languageJson.emailContent.yourTransactionPassword,
                        transactionPassword: response.data.txnPassword,
                        loginHere: languageJson.emailContent.loginHere,
                        linkText: languageJson.emailContent.notSeeSeeTheLogin,
                    }
                    htmlToSend = prepareEmailBody('email', 'user-password-reset', replacements)
                }
            }

            if (htmlToSend) {
                const message = {
                    from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                    to: email,
                    subject: passwordType == 'transaction_password' ? languageJson.emailContent.transactionResetSubject : languageJson.emailForgotPasswordSubject,
                    html: htmlToSend,
                }

                emailSender.sendMail(message, function (err, info) {
                    if (err) {
                        return res.status(statusCode.notFound.code).json({
                            code: statusCode.notFound.code,
                            message: statusCode.notFound.message,
                            data: err,
                        })
                    } else {
                        return res.status(statusCode.successData.code).json({
                            code: statusCode.successData.code,
                            message: statusCode.successData.message,
                            data: info,
                        })
                    }
                })
            } else {
                res.status(statusCode.serverError.code).json({
                    code: statusCode.serverError.code,
                    message: statusCode.serverError.message,
                })
            }
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/notifications', async (req, res) => {
    try {
        if (req.body.readAll != undefined && req.body.readAll == true) {
            await Notifications.updateMany({ read: 0 }, { $set: { read: 1 } })
            const notifications = await Notifications.find().sort({
                createdAt: -1,
            })
            res.json(notifications)
        } else {
            const notifications = await Notifications.find(req.body).sort({
                createdAt: -1,
            })
            res.json(notifications)
        }
    } catch (err) {
        logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/marknotificationasread', async (req, res) => {
    try {
        const notifications = await Notifications.findOneAndUpdate({ _id: req.body.notification_id }, { $set: { read: 1 } })
        res.json(notifications)
    } catch (err) {
        logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/resetpassword', async (req, res) => {
    try {
        const userData = await User.findOne({
            where: { email: req.body.email, isDeleted: 0 },
            include: [
                {
                    model: Organization,
                    attributes: ['id', 'name', 'blockchain_name'],
                },
            ],
        })
        const languageJson = await getLanguageJson(userData.language)

        //Get user unique ID from database
        const user_unique_id = userData.unique_id
        //Call update password API
        const requestBody = {
            orgName: userData.organization.blockchain_name.toLowerCase(),
            userName: user_unique_id,
            email: req.body.email,
            password: md5(req.body.password),
        }
        const dbPassword = userData.password
        const pswrd = req.body.password

        if (md5(pswrd) !== dbPassword) {
            const response = await networkHooks.callNetworkApi('account/reset-password', 'POST', requestBody, 'DEFAULT', true)

            // Send email to user
            if (response.success) {
                const replacements = {
                    userName: userData.dataValues.username,
                    URL: process.env.SITE_URL,
                    oborInfo: languageJson.emailContent.oborInfo,
                    passwordUpdateMessage: languageJson.emailContent.passwordUpdateMessage,
                    yourUsername: languageJson.emailContent.yourUsername,
                    username: userData.dataValues.username,
                    hi: languageJson.emailContent.hi,
                    yourTransactionPassword: languageJson.emailContent.yourTransactionPassword,
                    transactionPassword: response.transactionPassword,
                    loginHere: languageJson.emailContent.loginHere,
                    linkText: languageJson.emailContent.notSeeSeeTheLogin,
                }
                const htmlToSend = prepareEmailBody('email', 'profile-password-reset', replacements)
                const message = {
                    from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                    subject: languageJson.emailContent.userProfileResetSubject,
                    html: htmlToSend,
                }
                message.to = req.body.email
                emailSender.sendMail(message)

                // Send response to front end
                res.json(response)
            }
        } else {
            res.json({ error: err.message || err.toString() })
        }
    } catch (err) {
        logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/checkstatus', async (req, res) => {
    try {
        const userObj = await User.findOne({ include: [{ model: Organization }], where: { username: req.body.username, isDeleted: 0 } })
        if (userObj) {
            const isPublicUser = userObj.role_id == process.env.ROLE_PUBLIC_USER
            const isNotAuthUser = isPublicUser ? !userObj.isApproved : !userObj.isApproved && !userObj.status
            if (isNotAuthUser) {
                return res.json({
                    status: false,
                    message: isPublicUser ? string.apiResponses.accNotApprove : string.apiResponses.accNotAcitve,
                })
            }

            if (isPublicUser) {
                return res.json({ status: true })
            }
            // Check user status in Network
            const networkUser = await networkHelper.getClientId(userObj)
            if (!networkUser.success) {
                return res.json({
                    status: false,
                    message: string.apiResponses.accNotExists,
                })
            }
            res.json({ status: true })
        } else {
            res.json({
                status: false,
                message: string.apiResponses.accNotExists,
            })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

passport.use(
    'local-user',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async function (req, username, password, done) {
            password = md5(password)
            const user = await User.findOne({
                include: [
                    {
                        attributes: ['id', 'name', 'blockchain_name'],
                        model: Organization,
                        include: [
                            {
                                required: false,
                                attributes: ['purchase_date', 'plan', 'duration', 'status', 'id'],
                                model: Subscription,
                                where: {
                                    status: true,
                                },
                            },
                        ],
                    },
                ],
                where: { username, password, isDeleted: 0 },
            })
            if (!user) {
                return done(null, false, {
                    message: string.apiResponses.incorrectCred,
                })
            }
            if (!user.isApproved && !user.status) {
                return done(null, false, {
                    message: string.apiResponses.userNotActive,
                })
            }

            return done(null, user)
        },
    ),
)

router.post('/send-email-otp', async (req, res) => {
    const languageJson = await getLanguageJson(req.body.lang)

    const { email } = req.body
    const otp = otpHelper._generateotp()

    const replacements = {
        URL: process.env.SITE_URL,
        firstName: '',
        lastName: '',
        otp,
        signup: languageJson.emailContent.signup,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
        emailVerifCode: languageJson.emailVerifCode,
    }
    const htmlToSend = prepareEmailBody('email', 'email-otp-verification', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: email,
        subject: languageJson.emailOTPVerificationSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            res.status(statusCode.notFound.code).json({
                code: statusCode.notFound.code,
                message: statusCode.notFound.message,
                data: err,
            })
        } else {
            EmailVerification.findOne({ where: { email } }).then(async (res) => {
                if (res) {
                    await EmailVerification.update({ otp }, { where: { email } })
                } else {
                    EmailVerification.create({ email, otp })
                }
            })

            res.json({
                status: true,
                message: 'otp successfully send',
            })
        }
    })
})

router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body
    const emailObj = await EmailVerification.findOne({ where: { email } })

    if (emailObj.otp == otp) {
        await EmailVerification.destroy({
            where: { email, otp },
        })
        res.json({ verified: true })
    } else {
        res.json({ verified: false })
    }
})

router.post('/login', passport.authenticate('local-user'), async (req, res) => {
    const logindata = {
        user: req.user,
        session: req.sessionID,
    }
    const orgName = req.user.organization.blockchain_name
    connectToMongoDB(orgName)
    res.json(logindata)
})

// Remove user session on logout
router.post('/remove-user-session', async (req, res) => {
    try {
        const userSession = await Session.destroy({
            where: {
                session_id: req.body.session_id,
            },
        })
        res.json(userSession)
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id, User.publicFields(), (err, user) => {
        done(err, user)
    })
})

// Check email is valid or not
router.get('/validate-email/:email', async (req, res) => {
    try {
        const { email } = req.params
        const user = await User.findOne({
            where: { email, isDeleted: 0 },
            attributes: ['id'],
        })
        if (user && user.id) {
            res.json({ validEmail: true })
        } else {
            res.json({ validEmail: false })
        }
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

//  send otp on user mobile
router.post('/send-otp', async (req, res) => {
    try {
        const { id, questionId, questionAnswer } = req.body
        const user = await User.findOne({ where: { id, isDeleted: 0 }, attributes: ['country_code', 'mobile', 'language'] })
        const isValidAns = await UserSecurityAnswers.findOne({
            where: { user_id: id, question_id: questionId, answer: questionAnswer },
        })
        if (user && isValidAns) {
            if (questionAnswer !== isValidAns.answer) {
                res.status(200).json({ status: false, error: 'Answer is invalid' })
            } else if (user.country_code && user.mobile) {
                const languageJson = await getLanguageJson(user.language)
                // Create a save OTP
                const reqObj = {
                    verificationCode: otpHelper._generateotp(),
                    toNumber: user.mobile,
                    countrycode: user.country_code,
                    lang: user.language,
                    msgBody: languageJson.verificationSMSBody,
                }
                await otpHelper._sendOtpToWeb(reqObj)

                res.status(200).json({ status: true })
            } else {
                res.status(200).json({ status: false })
            }
        } else {
            res.status(200).json({ status: false, error: 'Answer is invalid' })
        }
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

//  Reset password
router.post('/set-new-password', async (req, res) => {
    try {
        const response = await networkHooks.callNetworkApi('account/update-password', 'POST', req.body, 'DEFAULT', true)
        res.json(response)
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})

server.use(passport.initialize())
server.use(passport.session())

module.exports = router

// Refresh access token
router.post('/refresh-token', async (req, res) => {
    try {
        const requestBody = {
            orgName: req.body.orgName,
            userName: req.body.userName,
        }
        const response = await networkHooks.callNetworkApi('account/refresh-token', 'POST', requestBody, 'DEFAULT', true)
        res.json(response)
    } catch (error) {
        res.json({ error: error.message || error.toString() })
    }
})
