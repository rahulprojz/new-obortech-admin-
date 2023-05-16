// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')

// Load MySQL Models
const db = require('../models')

const InventoryAssets = db.inventory_assets
const AssetCategory = db.assets_categories
const AssetsQuantities = db.assets_quantities
const ProjectEventAssets = db.project_event_assets
const Organizations = db.organizations

const { Op } = db.Sequelize

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

router.get('/fetch', async (req, res) => {
    try {
        const { limit, offset = 0, categorized, name, code, category, supplier, receiver, start = '', end = '', isInventory = false } = req.query
        const { organization_id } = req.user
        const where = { organization_id }

        const supplierWhere = {}
        const receiverWhere = {}

        if (isInventory && !!!(start && end)) {
            supplierWhere.supplier_org_id = { [Op.notIn]: [req.user.organization_id] }
            supplierWhere.receiver_org_id = req.user.organization_id
            receiverWhere.supplier_org_id = req.user.organization_id
            receiverWhere.receiver_org_id = { [Op.notIn]: [req.user.organization_id] }
        } else if (isInventory && !!(start && end)) {
            supplierWhere[Op.or] = [
                { supplier_org_id: { [Op.notIn]: [req.user.organization_id] }, receiver_org_id: req.user.organization_id },
                { supplier_org_id: req.user.organization_id, receiver_org_id: req.user.organization_id },
            ]
            receiverWhere[Op.or] = [
                { supplier_org_id: req.user.organization_id, receiver_org_id: { [Op.notIn]: [req.user.organization_id] } },
                { supplier_org_id: req.user.organization_id, receiver_org_id: req.user.organization_id },
            ]
        }
        if (categorized) {
            where.asset_category_id = categorized == 1 ? { [Op.not]: [1] } : 1
        }

        // Filter by assets name
        if (name) {
            where.name = name
        }

        // Filter by assets code
        if (code) {
            where.asset_code = code
        }

        // Filter by category
        if (category) {
            where.asset_category_id = category
        }

        // Filter by date range
        if (start && end) {
            supplierWhere.createdAt = {
                [Op.between]: [start, end],
            }
            receiverWhere.createdAt = {
                [Op.between]: [start, end],
            }
        }

        if (supplier) {
            supplierWhere.supplier_org_id = supplier
        }

        if (receiver) {
            receiverWhere.receiver_org_id = receiver
        }

        // Get unseen assets count
        const unSeenCount = await InventoryAssets.count({ where: { is_viewed: 0, asset_category_id: 1, organization_id } })

        // Update the unseen assets count
        if (categorized && categorized == 0) {
            await InventoryAssets.update({ is_viewed: 1 }, { where: { is_viewed: 0, organization_id } })
        }
        if (isInventory) {
            let tempSQL, tempSQL1
            const queryOptions = {
                attributes: ['id'],
                where: supplierWhere,
            }
            const queryOptions1 = {
                attributes: ['id'],
                where: receiverWhere,
            }

            tempSQL = db.sequelize.dialect.queryGenerator.selectQuery('project_event_assets', queryOptions, ProjectEventAssets).slice(0, -1) // to remove the ';' from the end of the SQL
            tempSQL1 = db.sequelize.dialect.queryGenerator.selectQuery('project_event_assets', queryOptions1, ProjectEventAssets).slice(0, -1) // to remove the ';' from the end of the SQL

            const projectEventAssets = await ProjectEventAssets.findAll({
                attributes: ['assets_code'],
                where: { [Op.or]: [{ id: { [Op.in]: db.sequelize.literal(`(${tempSQL1})`) } }, { id: { [Op.in]: db.sequelize.literal(`(${tempSQL})`) } }] },
            })

            // let whereInventory
            let query = [{ asset_code: { [Op.in]: projectEventAssets.map((eventAssets) => eventAssets.assets_code) } }]
            // we need to show all the assets if date was not showen
            if (!!!(start && end)) {
                query = [{ asset_code: { [Op.in]: projectEventAssets.map((eventAssets) => eventAssets.assets_code) } }, { organization_id }]
            }
            where[Op.or] = query
        }
        const filter = {
            include: [
                {
                    model: AssetCategory,
                },
                {
                    model: ProjectEventAssets,
                    include: [{ model: Organizations, attributes: ['id', 'name'], as: 'supplier_org' }],
                    group: ['supplier_org_id'],
                    as: 'supplier',
                    required: !!supplier,
                    where: supplierWhere,
                },
                {
                    model: ProjectEventAssets,
                    group: ['receiver_org_id'],
                    include: [{ model: Organizations, attributes: ['id', 'name'], as: 'receiver_org' }],
                    as: 'receiver',
                    required: !!receiver,
                    where: receiverWhere,
                },
            ],
            where,
        }

        if (isInventory) {
            filter.include.push({ model: AssetsQuantities, required: false, where: { organization_id } })
        }
        const allAssets = await InventoryAssets.findAll(filter)

        if (limit) {
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
            const response = await InventoryAssets.findAndCountAll(filter)
            response.unSeenCount = unSeenCount || 0
            response.count = allAssets.length || 0
            res.json(response)
        } else {
            res.json(allAssets)
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/update-assets', async (req, res) => {
    try {
        const record = await InventoryAssets.update(req.body, { where: { id: req.body.id } })
        res.json(record)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/add-assets', async (req, res) => {
    try {
        const { name, local_name, asset_category_id, subinfo, asset_code, measurement } = req.body
        const createAsset = await InventoryAssets.create({ name, local_name, asset_category_id, subinfo, asset_code, measurement, organization_id: req.user.organization_id })
        res.json(createAsset)
    } catch (err) {
        console.log(err)
    }
})

router.post('/check-asset-code', async (req, res) => {
    try {
        const { asset_code } = req.body
        const response = await InventoryAssets.findOne({
            where: { asset_code },
        })
        if (response) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/remove-assets/:id', async (req, res) => {
    try {
        const { id } = req.params
        await InventoryAssets.destroy({
            where: { id },
        })
        res.json({ success: true })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
