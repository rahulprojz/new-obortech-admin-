module.exports = (sequelize, Sequelize) => {
    const TamperDetail = sequelize.define('tamper_details', {
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
        status: {
            type: Sequelize.BOOLEAN,
        },
    })

    return TamperDetail
}
