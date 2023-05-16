// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const statusCode = require('../../utils/statusCodes')

// Load MySQL Models
const db = require('../models')

const DocumentTypes = db.document_type
const UserDocumentTypes = db.user_document_type
const UserTypes = db.user_types
const sequelize = db.sequelize
const Op = db.Sequelize.Op

// Define global variables
const router = express.Router()

router.get('/fetch/:id', async (req, res) => {
    try {
        const documentTypes = await UserDocumentTypes.findAll({
            where: {
                id: req.params.id,
            },
            include: [
                {
                    attributes: ['id', 'type'],
                    model: DocumentTypes,
                },
            ],
        })
        res.json(documentTypes)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch all DocumentTypes
router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const documentTypes = limit
            ? await DocumentTypes.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
            })
            : await DocumentTypes.findAll()
        res.json(documentTypes)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add DocumentType code
router.post('/add', async (req, res) => {
    try {
        const { type } = req.body
        const checkTypeExists = await DocumentTypes.findOne({
            where: {
                type: sequelize.where(sequelize.fn('LOWER', sequelize.col('type')), type.toLowerCase()),
            },
        })
        if (checkTypeExists) {
            return res.json({ typeAlreadyExists: true })
        } else {
            const documentType = await DocumentTypes.create({ type })
            if (documentType && documentType.dataValues) {
                res.status(201).json({ code: statusCode.createdData.code, data: documentType, message: statusCode.createdData.message })
            } else {
                res.status(400).json(statusCode.emptyData)
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update DocumentType code
router.post('/update', async (req, res) => {
    try {
        const { id, type } = req.body
        const checkTypeExists = await DocumentTypes.findOne({
            where: {
                id: { [Op.notIn]: [id] },
                type: sequelize.where(sequelize.fn('LOWER', sequelize.col('type')), type.toLowerCase()),
            },
        })
        if (checkTypeExists) {
            return res.json({ typeAlreadyExists: true })
        } else {
            const response = await DocumentTypes.update({ type }, { where: { id } })
            if (response) {
                res.json({ status: true })
            } else {
                res.json({ error: string.statusResponses.updateRecordErr })
            }
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Remove DocumentType code
router.post('/remove', async (req, res) => {
    try {
        const { id } = req.body
        DocumentTypes.destroy({ where: { id } })
            .then(async (result) => {
                if (result) {
                    await UserDocumentTypes.destroy({ where: { document_type_id: null } })
                    res.json({ success: true })
                } else {
                    res.json({ success: false })
                }
            })
            .catch((err) => {
                res.json({ error: err.message || err.toString() })
            })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
