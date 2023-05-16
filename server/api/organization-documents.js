// Load dependencies
const express = require('express')

// Load MySQL Models
const db = require('../models')
const Op = db.Sequelize.Op
const router = express.Router()

const OrganizationDocuments = db.organization_documents
const DocumentTypes = db.document_type

// Add document
router.post('/add', async (req, res) => {
    try {
        const addDocument = await OrganizationDocuments.create({
            organization_id: req.body.organization_id,
            type_id: req.body.type_id,
            name: req.body.name,
            hash: req.body.hash,
        })
        res.json(addDocument)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Fetch document
router.post('/fetch', async (req, res) => {
    try {
        const allDocuments = await OrganizationDocuments.findAll({
            include: [
                {
                    model: DocumentTypes,
                },
            ],
            where: {
                organization_id: req.body.organization_id,
            },
        })
        res.json(allDocuments)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
