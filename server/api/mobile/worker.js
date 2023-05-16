// Load dependencies
const express = require("express");
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');

//Worker login
router.post('/login', function (req, res, next) {
    passport.authenticate('local-worker', { session: false }, (err, user, messsage) => {

        if (err || !user) {
            return res.status(401).json({ messsage });
        }
        req.login(user, { session: false }, (err) => {
            if (err) {
                res.send(err);
            }

            // generate a signed json web token with the contents of user object and return it in the response
            const token = jwt.sign(user, 'your_jwt_secret', { expiresIn: '90d' });
            return res.json({ user, token });
        });
    })(req, res);
});

module.exports = router;
