module.exports = (sequelize, Sequelize) => {
    const TemperatureLog = sequelize.define('temperature_log', {
        project_id: {
            type: Sequelize.INTEGER,
        },
        group_id: {
            type: Sequelize.INTEGER,
        },
        truck_id: {
            type: Sequelize.INTEGER,
        },
        container_id: {
            type: Sequelize.INTEGER,
        },
        item_id: {
            type: Sequelize.INTEGER,
        },
        device_id: {
            type: Sequelize.INTEGER,
        },
        temperature: {
            type: Sequelize.FLOAT,
        },
    })

    return TemperatureLog
}
