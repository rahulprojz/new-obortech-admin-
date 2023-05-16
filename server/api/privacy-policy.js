const express = require('express')

const db = require('../models')
const statusCode = require('../../utils/statusCodes')
var pdf = require('html-pdf')
var fs = require('fs')
const dir = './server/upload/user-agreement'

// Load MySQL Models
const PrivacyPolicy = db.privacy_policy

// Define global variables
const router = express.Router()

router.get('/fetch', async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findOne()
        res.json(privacyPolicy || {})
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/update', async (req, res) => {
    try {
        const { html, lang } = req.body
        let updateQry = { en_html: html }
        if (lang.toLowerCase() == 'mn') {
            updateQry = { mn_html: html }
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            })
        }

        var formattedHtml =
            '<style>.ql-size-small,p{font-size: 10px !important} .ql-size-large{ font-size: 14px } .ql-align-center{text-align: center;} .ql-align-justify{ text-align: justify; } p{ font-family: "Poppins", sans-serif !important; font-weight:normal } strong{ font-weight:bold }</style>' + html
        var options = {
            format: 'A4',
            border: {
                top: '2.54cm', // default is 0, units: mm, cm, in, px
                right: '2.54cm',
                bottom: '2.54cm',
                left: '2.54cm',
            },
            quality: 100,
        }
        if (lang.toLowerCase() == 'mn') {
            pdf.create(formattedHtml, options).toFile('./server/upload/user-agreement/user-agreement-mn.pdf', function (err, res) {
                if (err) return console.log(err)
            })
        } else {
            pdf.create(formattedHtml, options).toFile('./server/upload/user-agreement/user-agreement-en.pdf', function (err, res) {
                if (err) return console.log(err)
            })
        }

        const privacyPolicy = await PrivacyPolicy.findOne()
        if (privacyPolicy) {
            await PrivacyPolicy.update(updateQry, { where: { id: privacyPolicy.id } })
        } else {
            await PrivacyPolicy.create(updateQry)
        }
        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
