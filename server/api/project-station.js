// Load dependencies
const express = require('express')
const string = require('../helpers/LanguageHelper')
const projectLogHelper = require('../helpers/project-log-helper')
// Load MySQL Models
const db = require('../models')
const projectEventHelper = require('../helpers/project-event-helper.js')
const { hostAuth, userAuth, jwtAuth } = require('../middlewares')

const ProjectRoad = db.project_roads
const Station = db.stations
const StationBorderInfo = db.station_border_info
const Project = db.projects
const LocatoinLog = db.location_logs

// Define global variables
const router = express.Router()
const { Op } = db.Sequelize

router.use(hostAuth)
router.use(jwtAuth)
router.use(userAuth)

// Fetch Project Roads
router.get('/', async (req, res) => {
    const project_id = parseInt(req.query.project_id)
    const item_id = parseInt(req.query.item_id)
    const insideWhereObj = { position: 'inside', project_id }
    const outsideWhereObj = { position: 'outside', project_id }
    const whereObj = { project_id }
    const isNotAdminRole = req.user.role_id != process.env.ROLE_ADMIN
    const isManagerRole = req.user.role_id == process.env.ROLE_MANAGER

    const project = await Project.findOne({ where: { id: project_id } })

    if (item_id) {
        whereObj.item_id = item_id
        insideWhereObj.item_id = item_id
        outsideWhereObj.item_id = item_id
    } else if (isManagerRole && project ? project.user_id != req.user.id : isNotAdminRole) {
        const userManualEvents = await projectEventHelper.fetchUserManualEvents(req, req.user.id, project_id)
        if (userManualEvents.length) {
            const itemId = userManualEvents.map((event) => parseInt(event.item_id))
            insideWhereObj.item_id = { [Op.in]: itemId }
            outsideWhereObj.item_id = { [Op.in]: itemId }
            whereObj.item_id = { [Op.in]: itemId }
        } else {
            return res.json([])
        }
    }

    try {
        const locationLogs = await LocatoinLog.findAll({
            attributes: ['latitude', 'longitude'],
            where: whereObj,
            order: [['id', 'ASC']],
        })
        const projectroad = await ProjectRoad.findAll({
            include: [
                {
                    model: Station,
                    include: [
                        {
                            model: StationBorderInfo,
                            as: 'inside',
                            where: insideWhereObj,
                            order: [['id', 'ASC']],
                            limit: 5,
                        },
                        {
                            model: StationBorderInfo,
                            as: 'outside',
                            where: outsideWhereObj,
                            order: [['id', 'ASC']],
                            limit: 5,
                        },
                    ],
                },
            ],
            where: {
                project_id,
            },
            order: [['id', 'ASC']],
        })
        const { roadArr, activeRoadTrip } = projectLogHelper.getLocationArray(projectroad)

        const projectTripStats = await projectLogHelper.getProjectTripStats(projectroad, project, locationLogs)

        res.json({ projectroad, roadArr, activeRoadTrip, projectTripStats })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
