module.exports = (sequelize, Sequelize) => {
    const SealingDetail = sequelize.define('sealing_detail', {
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
        event_id: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.STRING,
        },
        open_count: {
            type: Sequelize.INTEGER,
        },
        close_count: {
            type: Sequelize.INTEGER,
        },
        is_active: {
            type: Sequelize.INTEGER,
        },
    })

    return SealingDetail
}
