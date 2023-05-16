const express = require('express')

const db = require('../models')
const statusCode = require('../../utils/statusCodes')
const { formBuilder } = require('../helpers/LanguageHelper')

// Load MySQL Models
const FormBuilder = db.form_builder
const FormOptions = db.form_options
const Event = db.events

// Define global variables
const router = express.Router()

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            res.json({ error: 'Missing Id' })
        }

        const form = await FormBuilder.findOne({
            where: { id },
        })

        console.log('this the  requested form builder data', form)

        res.json(form && form.dataValues ? form.dataValues.data : [])
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/options/', async (req, res) => {
    try {
        const { options, id } = req.body

        if (!options || !id) {
            res.json({ error: 'Missing params' })
        }

        await FormOptions.create({
            options,
            organization_id: id,
        })

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/', async (req, res) => {
    try {
        const { data, id, formname } = req.body

        if (!data || !id) {
            res.json({ error: 'Missing params' })
        }

        const formData = await FormBuilder.create({
            data,
            formname: formname,
            organization_id: id,
        })

        res.json(formData)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/:id', async (req, res) => {
    try {
        const { data } = req.body
        const { id } = req.params
        let form_name = ''
        if (req.body.hasOwnProperty('formname') && req.body.formname != null && req.body.formname != '') {
            form_name = req.body.formname ? req.body.formname : ''
        }

        if (form_name != '') {
            await FormBuilder.update({ data, formname: form_name }, { where: { id } })
        } else {
            await FormBuilder.update({ data }, { where: { id } })
        }

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/get-form/:id', async (req, res) => {
    try {
        const { id } = req.params
        const formBuider = await FormBuilder.findOne({ where: { id } })
        res.json({ formBuider })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/fetch-list/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            res.json({ error: 'Missing params' })
        }

        const formList = await FormBuilder.findAll({
            where: {
                organization_id: id,
            },
            attributes: {
                exclude: ['data'],
            },
        })

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
            data: formList,
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/options/fetch/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            res.json({ error: 'Missing params' })
        }

        const formOptions = await FormOptions.findOne({
            where: { id },
        })

        // Sending only array to support form-builder
        res.status(statusCode.successData.code).json(formOptions.options || [])
    } catch (err) {
        // Sending blank array when api failes
        res.status(statusCode.successData.code).json([])
    }
})

router.post('/remove/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            res.json({ error: 'Missing params' })
        }
        await FormBuilder.destroy({
            where: { id },
        })
            .then(async (result) => {
                //Unlink form from EVENT as well
                await Event.update(
                    { form_id: 0 },
                    {
                        where: {
                            form_id: id,
                        },
                    },
                )
                res.json(result)
            })
            .catch((err) => {
                res.json({ error: err.message || err.toString() })
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
