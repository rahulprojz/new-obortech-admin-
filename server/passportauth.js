// Load dependencies
const passport    = require('passport');
const md5 = require("md5");
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const string = require('./helpers/LanguageHelper');


// Load Models
const db = require("./models");
const Worker = db.workers;

passport.use('local-worker', new LocalStrategy({
        usernameField: 'phonenumber',
        passwordField: 'otp'
    },
    function (phonenumber, otp, cb) {

        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return Worker.findOne({
            where: { phone: phonenumber }
        })
        .then(user => {

            if (!user) {
                return cb(null, false, string.apiResponses.phoneNumberNotRegistered);
            }

            if (user.otp != otp) {
                return cb(null, false, string.apiResponses.invalidOTP);
            }

            let userObj = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                status: user.isActive
            }

            user.update({
                otp: "",
                is_verified: 1
            }).then(worker => {
                return cb(null, userObj, string.apiResponses.loggedInSuccess);
            }).catch(err => cb(err));

        }).catch(err => cb(err));
    }
));

passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : 'your_jwt_secret'
    },
    function (jwtPayload, cb) {

        return Worker.findOne({
            where: { id: jwtPayload.id }
        })
        .then(user => {
            return cb(null, user);
        })
        .catch(err => {
            return cb(err);
        });
    }
));
