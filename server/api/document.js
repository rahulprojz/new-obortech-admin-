const express = require('express')
const aws = require('aws-sdk')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const router = express.Router()
const db = require('../models')
const mdb = require('../models/mangoose/index.model')

const ProjectEventUsers = db.project_event_users

router.use((req, res, next) => {
    if (!req.user) {
        // const isExist = await ProjectEventUsers.fin
        res.status(401).send('<h3>' + string.statusResponses.unAuthoried + '</h3>')
        return
    }
    next()
})

// Download and view document from S3 | Secured
router.get('/view/:event_submission_id/:name', async (req, res) => {
    try {
        const MProjectEvent = await mdb.project_event(req.user.organization.blockchain_name)
        const { event_submission_id } = req.params
        const user_id = req.user.id
        const isExist = await MProjectEvent.findOne({ event_submission_id, viewUsers: { $elemMatch: { user_id } } }).exec()
        if (isExist) {
            aws.config.update({
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                region: process.env.AWS_REGION,
            })

            const s3 = new aws.S3({})
            var params = { Bucket: 'blockchaindoc', Key: req.params.name }

            s3.getObject(params, function (err, data) {
                if (err) {
                    res.status(200)
                    res.end(string.errors.filenotexists)
                } else {
                    res.setHeader('Content-disposition', 'inline; filename="' + params.Key + '"')
                    res.type(data.ContentType)
                    res.send(data.Body)
                }
            })
        } else {
            res.status(401).send('<h3>' + string.statusResponses.unAuthoried + '</h3>')
            return
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
