const express = require("express");
const db = require("../models");
const Worker = db.workers;
const Op = db.Sequelize.Op;
const router = express.Router();
const string = require('../helpers/LanguageHelper');

router.use((req, res, next) => {
	if (!req.user) {
		res.status(401).json({ error: string.statusResponses.unAuthoried });
		return;
	}
	next();
});

/**
 * Fetch Workers
 */
router.get("/fetch", async (req, res) => {
    try {
        let workers = [];
        workers = await Worker.findAll({
            attributes: ["first_name","last_name","id"],
            where: {
                isActive: 1,
                is_verified: 1
            }
        });

		res.json(workers);
	} catch (err) {
		res.json({ error: err.message || err.toString() });
	}
});

module.exports = router;
