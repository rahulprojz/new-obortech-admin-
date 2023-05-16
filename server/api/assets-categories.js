// Load dependencies
const express = require('express')
const db = require('../models')
const string = require('../helpers/LanguageHelper')

// Define global variables
const router = express.Router()

const AssetsCategories = db.assets_categories

const { Op } = db.Sequelize

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

router.post('/create-category', async (req, res) => {
    try {
        const { name, local_name } = req.body
        const payload = { name, local_name, organization_id: req.user.organization_id }
        const resp = await AssetsCategories.create(payload)
        return res.json(resp)
    } catch (err) {
        console.log(err, 'err')
        return res.send({ error: err.message, _success: false })
    }
})

router.post('/update-category', async (req, res) => {
    try {
        const record = await AssetsCategories.update(req.body, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/fetch-category', async (req, res) => {
    try {
        const { limit, offset = 0 } = req.query
        const filter = {
            attributes: ['id', 'name', 'local_name', 'organization_id'],
            where: { [Op.or]: [{ id: 1 }, { organization_id: req.user.organization_id }] },
        }

        if (limit) {
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
        }
        const response = limit ? await AssetsCategories.findAndCountAll(filter) : await AssetsCategories.findAll(filter)
        res.json(response)
    } catch (error) {
        console.log(error, 'error')
        res.json({ error: error.message || error.toString() })
    }
})

// Remove Category code
router.post('/remove-category/:id', async (req, res) => {
    try {
        const { id } = req.params
        await AssetsCategories.destroy({
            where: { id },
        })
        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
