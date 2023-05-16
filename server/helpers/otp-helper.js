const twilio = require('twilio')
const string = require('../helpers/LanguageHelper')
const axios = require('axios')

// Load Models
const db = require('../models')
const Worker = db.workers
const User = db.users
const TempNumberVerification = db.temp_number_verification

//Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER

//Send otp to web
const _sendOtpToWeb = async (reqObj) => {
    let response

    try {
        //Destroy all old OTPs
        await TempNumberVerification.destroy({
            where: { number: reqObj.toNumber },
        })

        //Save new OTP
        await TempNumberVerification.create({
            otp: reqObj.verificationCode,
            number: reqObj.toNumber,
        })

        //Send OTP in SMS
        const otpResponse = await _sendOtp(reqObj.verificationCode, reqObj.countrycode, reqObj.toNumber, reqObj.msgBody)
        if (otpResponse.success) {
            response = {
                data: {
                    code: 1,
                },
                code: 200,
            }
        } else if (otpResponse.message.includes('unsubscribed recipient')) {
            response = {
                data: {
                    code: 1,
                },
                code: 200,
            }
        } else {
            response = {
                data: {
                    code: 2,
                    message: otpResponse.message,
                },
                code: 400,
            }
        }
    } catch (error) {
        response = {
            data: {
                code: 2,
                message: error.message || err.toString(),
            },
            code: 500,
        }
    }

    return response
}

//Send otp to mobile
const _sendOtpToMobile = async (reqObj) => {
    let response

    try {
        const worker = await Worker.findOne({
            where: { phone: reqObj.toNumber },
        })

        if (worker) {
            await worker.update({
                otp: reqObj.verificationCode,
            })

            //Send OTP in SMS
            const otpResponse = await _sendOtp(reqObj.verificationCode, reqObj.countrycode, reqObj.toNumber, reqObj.msgBody)
            if (otpResponse.success) {
                response = {
                    data: {
                        code: 1,
                        message: string.apiResponses.smsSentSuccess,
                    },
                    code: 200,
                }
            } else {
                response = {
                    data: {
                        code: 2,
                        message: otpResponse.message,
                    },
                    code: 400,
                }
            }
        } else {
            response = {
                data: {
                    code: 2,
                    message: string.apiResponses.phoneNumberNotRegistered,
                },
                code: 400,
            }
        }
    } catch (error) {
        response = {
            data: {
                code: 2,
                message: error.message || err.toString(),
            },
            code: 500,
        }
    }

    return response
}

//Send OTP via Twilio
const _sendOtp = async (verificationCode, countrycode, toNumber, smsBody) => {
    try {
        await sendWebhookOTP(toNumber, verificationCode)

        const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        const message = await client.messages.create({
            body: smsBody + verificationCode,
            to: countrycode + toNumber, // Text this number
            from: TWILIO_FROM_NUMBER, // From a valid Twilio number
        })

        console.log('sendSMS Response - ', message)

        return {
            success: true,
            message: message,
        }
    } catch (error) {
        console.log('sendSMS Error - ', error)
        return {
            success: false,
            message: error.message || err.toString(),
        }
    }
}

//Verify mobile OTP
const _verifyMobileOtp = async (reqObj) => {
    let response

    try {
        const verificationCode = reqObj.verificationCode
        const toNumber = reqObj.toNumber

        const worker = await Worker.findOne({
            where: { phone: toNumber, otp: verificationCode },
        })

        if (worker) {
            await worker.update({
                otp: '',
                is_verified: 1,
            })

            response = {
                data: {
                    code: 1,
                },
                code: 200,
            }
        } else {
            response = {
                data: {
                    code: 2,
                    message: string.apiResponses.invalidOTP,
                },
                code: 400,
            }
        }
    } catch (error) {
        response = {
            data: {
                code: 2,
                message: error.message || err.toString(),
            },
            code: 500,
        }
    }

    return response
}

//Verify web OTP
const _verifyWebOtp = async (reqObj) => {
    let response

    try {
        const verificationCode = reqObj.verificationCode
        const toNumber = reqObj.toNumber

        const tempNumber = await TempNumberVerification.findOne({
            where: { number: toNumber, otp: verificationCode },
        })

        if (tempNumber) {
            await tempNumber.destroy({
                where: { number: toNumber, otp: verificationCode },
            })

            response = {
                data: {
                    code: 1,
                    message: string.apiResponses.phoneNoVerifiedSuccessfully,
                },
                code: 200,
            }
        } else {
            response = {
                data: {
                    code: 2,
                    message: string.apiResponses.invalidOTP,
                },
                code: 400,
            }
        }
    } catch (error) {
        response = {
            data: {
                code: 2,
                message: error.message || err.toString(),
            },
            code: 500,
        }
    }

    return response
}

// Function to generate OTP
const _generateotp = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

const _sendVerificationMsg = async (msgBody, countrycode, toNumber, verificationCode) => {
    try {
        const phoneNumber = countrycode ? countrycode + toNumber : toNumber
        await sendWebhookOTP(toNumber, verificationCode)

        const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        const message = await client.messages.create({
            body: msgBody,
            to: phoneNumber, // Text this number
            from: TWILIO_FROM_NUMBER, // From a valid Twilio number
        })

        return {
            success: true,
            message: message,
        }
    } catch (error) {
        return {
            success: false,
            message: error.message || err.toString(),
        }
    }
}

// We are using this webhook for temporary purpose, will remove it later
const sendWebhookOTP = async (phoneNumber, otp) => {
    try {
        const user = await User.findOne({
            attributes: ['username'],
            where: {
                mobile: phoneNumber,
                isDeleted: 0,
            },
        })
        const userName = user ? user.username : string.newUser

        var data = JSON.stringify({
            text: `OTP for ${userName}(${phoneNumber}) -- ${otp}`,
        })

        var config = {
            method: 'post',
            url: 'https://chaincodeconsultingllp301.webhook.office.com/webhookb2/ed32704e-3a8a-479f-90af-654fc18e55b6@74da2a09-7275-4d60-940d-fdb10fbd2e31/IncomingWebhook/7735c848a01b4963b419ed00ae4f92d1/83632ef9-5b6d-4cc4-8807-6f80cac33542',
            headers: {
                'Content-Type': 'application/json',
            },
            data: data,
        }

        const response = await axios(config)
        console.log('sendWebhookOTP -- ', response.data)
    } catch (error) {
        console.log('sendWebhookOTP -- ', error)
    }
}

exports._sendOtpToWeb = _sendOtpToWeb
exports._sendOtpToMobile = _sendOtpToMobile
exports._verifyMobileOtp = _verifyMobileOtp
exports._verifyWebOtp = _verifyWebOtp
exports._generateotp = _generateotp
exports._sendVerificationMsg = _sendVerificationMsg
exports._sendOtp = _sendOtp
