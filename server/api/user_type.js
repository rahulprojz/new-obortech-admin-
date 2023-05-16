// Load dependencies
const express = require('express')
const statusCode = require('../../utils/statusCodes')
const string = require('../helpers/LanguageHelper')
const forEach = require('async-foreach').forEach

// Load MySQL Models
const db = require('../models')
const Type = db.user_types
const sequelize = db.sequelize
const Organization = db.organizations
const UserDocType = db.user_document_type
const DocType = db.document_type
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

// Add New Type - /api/v1/types
router.post('/add', async (req, res) => {
    try {
        const checkTypeExists = await Type.findAll({
            where: {
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), req.body.name.toLowerCase()),
            },
        })
        if (checkTypeExists.length > 0) {
            res.json({ typeAlreadyExists: true })
        } else {
            const response = await Type.create({
                name: req.body.name,
            })

            forEach(req.body.documentType, async function (type) {
                const document = await DocType.findOne({
                    where: {
                        type,
                    },
                    raw: true,
                })
                await UserDocType.create({
                    id: response.id,
                    document_type_id: document.id,
                })
            })

            if (response && response.dataValues) {
                res.status(201).json({
                    code: statusCode.createdData.code,
                    data: response,
                    message: statusCode.createdData.message,
                })
            } else {
                res.status(400).json(statusCode.emptyData)
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update Types
router.post('/update', async (req, res) => {
    try {
        const { id, name, document_type } = req.body
        const checkTypeExists = await Type.findAll({
            where: {
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.toLowerCase()),
                id: { [Op.notIn]: [id] },
            },
        })
        if (checkTypeExists.length > 0) {
            res.json({ typeAlreadyExists: true })
        } else {
            const response = await Type.update({ name }, { where: { id } })

            if (!response) {
                res.json({ error: string.statusResponses.updateRecordErr })
            } else {
                await UserDocType.destroy({ where: { id } })
                forEach(document_type, async function (type) {
                    const document = await DocType.findOne({ where: { type }, raw: true })
                    await UserDocType.create({ id, document_type_id: document.id })
                })
                res.status(201).json({
                    code: statusCode.createdData.code,
                    message: statusCode.createdData.message,
                })
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// List all Types - /api/v1/types/
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const response = limit
            ? await Type.findAndCountAll({
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                  order: [['createdAt', 'DESC']],
              })
            : await Type.findAll()
        const isValid = !!(response && (limit ? response.rows && response.rows.length : response.length))
        if (isValid) {
            res.status(200).json({
                code: statusCode.successData.code,
                data: response,
                message: statusCode.successData.message,
            })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch doc type
router.get('/fetch-doc/:id', async (req, res) => {
    try {
        const id = req.params.id
        const response = await UserDocType.findAll({
            where: { id },
            include: [
                {
                    model: DocType,
                },
            ],
        })
        if (response.length > 0) {
            res.status(200).json({
                code: statusCode.successData.code,
                data: response,
                message: statusCode.successData.message,
            })
        } else {
            res.status(400).json(statusCode.emptyData)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove Types code
router.post('/remove', async (req, res) => {
    try {
        const organization = await Organization.findOne({
            where: {
                type_id: req.body.id,
                isDeleted: 0,
            },
        })
        if (organization) {
            res.json({ status: false })
        } else {
            await Type.destroy({
                where: { id: req.body.id },
            })
            res.json({ status: true })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})
module.exports = router
