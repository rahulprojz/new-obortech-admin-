const passport = require('passport')
const Strategy = require('passport-google-oauth').OAuth2Strategy
const mongoose = require('mongoose')
const db = require('./models')
const User = db.users
const Organization = db.organizations
const Subscription = db.subscription

function auth({ ROOT_URL, server }) {
    const verify = async (accessToken, refreshToken, profile, verified) => {
        let email
        let avatarUrl

        if (profile.emails) {
            email = profile.emails[0].value
        }

        if (profile.photos && profile.photos.length > 0) {
            avatarUrl = profile.photos[0].value.replace('sz=50', 'sz=128')
        }

        try {
            const user = await User.signInOrSignUp({
                googleId: profile.id,
                email,
                googleToken: { accessToken, refreshToken },
                displayName: profile.displayName,
                avatarUrl,
            })
            verified(null, user)
        } catch (err) {
            verified(err)
            console.error(err) // eslint-disable-line
        }
    }

    passport.use(
        new Strategy(
            {
                clientID: process.env.Google_clientID,
                clientSecret: process.env.Google_clientSecret,
                callbackURL: `${ROOT_URL}/oauth2callback`,
            },
            verify,
        ),
    )

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser((id, done) => {
        User.findOne({
            include: {
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
                where: { isDeleted: 0 },
            },
            where: { id, isDeleted: 0 },
        }).then(function (user) {
            if (user) {
                done(null, user.get())
            } else {
                done(null, null)
            }
        })
    })

    server.use(passport.initialize())
    server.use(passport.session())

    server.get('/auth/google', (req, res, next) => {
        const options = {
            scope: ['profile', 'email'],
            prompt: 'select_account',
        }

        if (req.query && req.query.redirectUrl && req.query.redirectUrl.startsWith('/')) {
            req.session.finalUrl = req.query.redirectUrl
        } else {
            req.session.finalUrl = null
        }

        passport.authenticate('google', options)(req, res, next)
    })

    server.get(
        '/oauth2callback',
        passport.authenticate('google', {
            failureRedirect: '/login',
        }),
        (req, res) => {
            if (req.user && req.user.isAdmin) {
                res.redirect('/admin')
            } else if (req.session.finalUrl) {
                res.redirect(req.session.finalUrl)
            } else {
                res.redirect('/my-books')
            }
        },
    )

    server.get('/logout', (req, res) => {
        // mongoose.disconnect()
        req.logout()
        res.redirect('/login')
    })
}

module.exports = auth
