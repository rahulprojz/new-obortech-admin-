module.exports = (sequelize, Sequelize) => {
    const ProjectEvent = sequelize.define('project_event', {
        event_id: {
            type: Sequelize.STRING,
        },
        event_name: {
            type: Sequelize.STRING,
        },
        local_event_name: {
            type: Sequelize.STRING,
        },
        event_submission_id: {
            type: Sequelize.STRING,
        },
        worker_id: {
            type: Sequelize.INTEGER,
        },
        project_id: {
            type: Sequelize.INTEGER,
        },
        group_id: {
            type: Sequelize.INTEGER,
        },
        form_id: {
            type: Sequelize.INTEGER,
        },
        groupName: {
            type: Sequelize.STRING,
        },
        truck_id: {
            type: Sequelize.INTEGER,
        },
        truckName: {
            type: Sequelize.STRING,
        },
        container_id: {
            type: Sequelize.INTEGER,
        },
        containerName: {
            type: Sequelize.STRING,
        },
        item_id: {
            type: Sequelize.INTEGER,
        },
        itemName: {
            type: Sequelize.STRING,
        },
        road_id: {
            type: Sequelize.INTEGER,
        },
        device_id: {
            type: Sequelize.INTEGER,
        },
        deviceName: {
            type: Sequelize.STRING,
        },
        deviceTag: {
            type: Sequelize.STRING,
        },
        attachment: {
            type: Sequelize.STRING,
        },
        attachment_type: {
            type: Sequelize.INTEGER,
        },
        file_hash: {
            type: Sequelize.STRING,
        },
        image_url: {
            type: Sequelize.STRING,
        },
        isActive: {
            type: Sequelize.INTEGER,
        },
        current_temp: {
            type: Sequelize.FLOAT,
        },
        current_hum: {
            type: Sequelize.FLOAT,
        },
        document_deadline: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
        image_base: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.TEXT,
        },
        location: {
            type: Sequelize.STRING,
        },
        title: {
            type: Sequelize.STRING,
        },
        isAddedInBlockchain: {
            type: Sequelize.BOOLEAN,
        },
        pdc_id: {
            type: Sequelize.STRING,
        },
        due_date: {
            type: Sequelize.DATE,
        },
        has_sub_events: {
            type: Sequelize.INTEGER,
        },
        isPublicEvent: {
            type: Sequelize.BOOLEAN,
        },
    })

    return ProjectEvent
}
