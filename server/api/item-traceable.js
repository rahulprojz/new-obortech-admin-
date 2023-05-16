const express = require('express')
const projectHelper = require('../helpers/project-helper')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const SelectionItem = db.selection_items
const SelectionContainer = db.selection_containers
const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

const tokenMiddleware = async (req, res, next) => {
    try {
        const api_token = req.headers['api-token']
        if (api_token == process.env.ITEM_TRACEABLE_KEY) return next()
        else return res.status(401).send({ status: 401, message: string.middlewares.invalidAccessToken })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
}

router.get('/:traceableid/:actionType', [tokenMiddleware], async (req, res) => {
    try {
        const { traceableid, actionType } = req.params
        const { existingInContainer, existingInItem } = await projectHelper.checkManualCode(traceableid)
        let items = []
        let details = []
        if (existingInContainer) {
            const selectionIds = []
            const selectionContainers = await SelectionContainer.findAll({
                attributes: ['selection_id'],
                where: {
                    container_id: existingInContainer.id,
                },
                order: [['id', 'ASC']],
            })

            selectionContainers.map((container) => selectionIds.push(container.selection_id))
            const selectionItems = await SelectionItem.findAll({
                where: {
                    selection_id: { [Op.in]: selectionIds },
                },
            })

            items = selectionItems.map((item) => item.item_id)
        }
        if (existingInItem) {
            items = [existingInItem.id]
        }

        if (items.length) {
            details = await projectHelper.fetchDetailsByCode(actionType, items)
        }

        res.json({ details })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})


router.get('/:traceableid/:qr_code/:actionType', [tokenMiddleware], async (req, res) => {
    try {
        const { traceableid, actionType, qr_code } = req.params
        const { existingInContainer, existingInItem } = await projectHelper.checkManualCode(traceableid, qr_code)
        let items = []
        let details = []
        if (existingInContainer) {
            const selectionIds = []
            const selectionContainers = await SelectionContainer.findAll({
                attributes: ['selection_id'],
                where: {
                    container_id: existingInContainer.id,
                },
                order: [['id', 'ASC']],
            })

            selectionContainers.map((container) => selectionIds.push(container.selection_id))
            const selectionItems = await SelectionItem.findAll({
                where: {
                    selection_id: { [Op.in]: selectionIds },
                },
            })

            items = selectionItems.map((item) => item.item_id)
        }
        if (existingInItem) {
            items = [existingInItem.id]
        }

        if (items.length) {
            details = await projectHelper.fetchDetailsByCode(actionType, items)
        }

        res.json({ details })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
