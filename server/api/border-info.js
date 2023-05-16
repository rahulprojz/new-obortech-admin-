// Load dependencies
const express = require('express');
const string = require('../helpers/LanguageHelper');

// Load MySQL Models
const db = require("../models");
const StationBorderInfo = db.station_border_info;
const Station = db.stations;
const RoadMap = db.road_maps;

// Define global variables
const router = express.Router();
const Op = db.Sequelize.Op;

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried });
        return;
    }
    next();
});

// Fetch Station Border Info
router.post('/fetch', async (req, res) => {

    let project_id = req.body.project_id;
    let container_id = req.body.container_id;

    try {
        const stationborderinfo = await StationBorderInfo.findAll({
            include: [
                {
                    model: Station,
                    include: [
                        {
                            model: RoadMap,
                            as: 'inside',
                            where: {
                                position: { [Op.or]: ['inside'] }
                            },
                            order: [
                                ['id', 'ASC']
                            ],
                            limit: 1
                        },
                        {
                            model: RoadMap,
                            as: 'outside',
                            where: {
                                position: { [Op.or]: ['outside'] }
                            },
                            order: [
                                ['id', 'DESC']
                            ],
                            limit: 1
                        }
                    ]
                }
            ],
            where: {
                project_id: project_id,
                container_id: container_id
            }
        });
        res.json(stationborderinfo);
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
});

module.exports = router;
