module.exports = (sequelize, Sequelize) => {
    const ProjectTempEvent = sequelize.define("project_temp_event", {
        event_id: {
            type: Sequelize.STRING
        },
        project_id: {
            type: Sequelize.INTEGER
        },
        group_id: {
            type: Sequelize.INTEGER
        },
        truck_id: {
            type: Sequelize.INTEGER
        },
        container_id: {
            type: Sequelize.INTEGER
        },
        item_id: {
            type: Sequelize.INTEGER
        },
        device_id: {
            type: Sequelize.INTEGER
        },
        road_id: {
            type: Sequelize.INTEGER
        },
        current_temp: {
            type: Sequelize.FLOAT
        },
        current_hum: {
            type: Sequelize.FLOAT
        },
        is_deleted: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectTempEvent;
};