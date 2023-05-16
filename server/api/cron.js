// Load dependencies
const express = require('express')
const router = express.Router()
const moment = require('moment')
const cronmanager = require('../cronmanager.js')
const _ = require('lodash')

// Load MySQL Models
const db = require('../models')
const Project = db.projects
const SelectionItem = db.selection_items
const ProjectSelection = db.project_selections

router.post('/start-tracking', async (req, res) => {
    try {
        const { id } = req.body
        // add cron and start it
        // await cronmanager.addCronJob(id)
        res.json({ cron_job_started: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/start-item-tracking', async (req, res) => {
    try {
        // const { item_id, project_id } = req.body
        // const projectSelection = await ProjectSelection.findOne({
        //     include: [
        //         {
        //             model: SelectionItem,
        //             where: { item_id },
        //         },
        //     ],
        //     where: {
        //         project_id,
        //     },
        // })
        // if (projectSelection && projectSelection.selection_items && projectSelection.selection_items[0].is_start) {
        //     res.json({ projectSelection, isAlreadyStarted: true })
        // } else {
        //     // Change is_start flag
        //     SelectionItem.update(
        //         {
        //             is_start: 1,
        //             start_date_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        //         },
        //         {
        //             where: {
        //                 item_id,
        //                 selection_id: projectSelection.id,
        //             },
        //         },
        //     ).then(async function (result) {
        //         if (result) {
        //             // add cron and start it
        //             await cronmanager.addCronJob(project_id, item_id)
        //             const updatedItem = await SelectionItem.findOne({ where: { item_id, selection_id: projectSelection.id } })
        //             res.json({ updatedItem, isAlreadyStarted: false })
        //         }
        //     })
        // }
        // await cronmanager.addCronJob(project_id, item_id)
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/stop-tracking', async (req, res) => {
    try {
        // stop cron
        // await cronmanager.restartCron()
        console.log('Cron job Restarted')
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/restart-cron', async (req, res) => {
    try {
        // await cronmanager.restartCron()
        console.log('Restart Cron job')
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

router.get('/list-cron', async (req, res) => {
    try {
        // await cronmanager.getCronJobs()
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

module.exports = router
