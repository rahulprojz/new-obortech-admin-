const fs = require('fs');
const jwt = require('jsonwebtoken');

// use 'utf8' to get string instead of byte array  (512 bit key)
let privateKEY = fs.readFileSync(__dirname + '/secret.pem', 'utf8');
let publicKEY = fs.readFileSync(__dirname + '/public.pem', 'utf8');
module.exports = {
    sign: (payload, Options) => {

        let signOptions = {
            issuer: Options.issuer,
            subject: Options.subject,
            audience: Options.audience,
            expiresIn: "30d",    // 30 days validity
            algorithm: "RS256"
        };
        return jwt.sign(payload, privateKEY, signOptions);
    },
    signTempToken: (payload, Options) => {

        let signOptions = {
            issuer: Options.issuer,
            subject: Options.subject,
            audience: Options.audience,
            expiresIn: "5m",    // 30 days validity
            algorithm: "RS256"
        };
        return jwt.sign(payload, privateKEY, signOptions);
    },
    verify: (token, option) => {
        let verifyOptions = {
            issuer: option.issuer,
            subject: option.subject,
            audience: option.audience,
            expiresIn: "30d",
            algorithm: ["RS256"]
        };
        try {
            return jwt.verify(token, publicKEY, verifyOptions);
        } catch (err) {
            return false;
        }
    },
    verifyExternalApi: (token, option, type) => {
        let verifyOptions = {
            issuer: option.issuer,
            subject: option.subject,
            audience: option.audience,
            expiresIn: "5m",    // 5 min validity
            algorithm: ["RS256"]
        };
        switch (type) {
            case "temp":
                verifyOptions.expiresIn = "5m"  // 5 min validity
                break;

            case "internal":
                verifyOptions.expiresIn = "1h"  // 1 hours validity
                break;

            case "external":
                verifyOptions.expiresIn = "8h"  // 1 hours validity
                break;

            default:
                verifyOptions.expiresIn = "5m"  // 5 min validity
                break;
        }
        try {
            return jwt.verify(token, publicKEY, verifyOptions);
        } catch (err) {
            return false;
        }
    }
}
