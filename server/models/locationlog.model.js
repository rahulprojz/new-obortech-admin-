module.exports = (sequelize, Sequelize) => {
    const LocationLog = sequelize.define('location_log', {
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
        latitude: {
            type: Sequelize.STRING,
        },
        longitude: {
            type: Sequelize.STRING,
        },
    })

    return LocationLog
}
