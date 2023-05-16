module.exports = (sequelize, Sequelize) => {
    const Project_alerts = sequelize.define('project_alerts', {
        project_id: {
            type: Sequelize.INTEGER,
            defaultValue: null,
        },
        selection_id: {
            type: Sequelize.INTEGER,
            defaultValue: null,
        },
        device_id: {
            type: Sequelize.INTEGER,
            defaultValue: null,
        },
        changed_selection: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        selection_element: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
        temperature_alert_min: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        temperature_alert_max: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        temperature_alert_interval: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        temperature_allowed_occurances: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        humidity_alert_min: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        humidity_alert_max: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        humidity_alert_interval: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        humidity_allowed_occurances: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        ambience_threshold: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
    })

    return Project_alerts
}
