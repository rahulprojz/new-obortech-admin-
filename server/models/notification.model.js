module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define('notification', {
        user_id: {
            type: Sequelize.INTEGER,
        },
        project_id: {
            type: Sequelize.INTEGER,
        },
        project_event_id: {
            type: Sequelize.INTEGER,
        },
        item_id: {
            type: Sequelize.INTEGER,
        },
        event_id: {
            type: Sequelize.STRING,
        },
        from: {
            type: Sequelize.INTEGER,
        },
        event_type: {
            type: Sequelize.STRING,
        },
        event_action: {
            type: Sequelize.STRING,
        },
        isRead: {
            type: Sequelize.BOOLEAN,
        },
    })

    return Notification
}
