module.exports = (sequelize, Sequelize) => {
    const NotificationSetting = sequelize.define('notification_setting', {
        user_id: {
            type: Sequelize.INTEGER,
        },
        project_id: {
            type: Sequelize.INTEGER,
        },
        document_acceptance: {
            type: Sequelize.BOOLEAN,
        },
        document_comment: {
            type: Sequelize.BOOLEAN,
        },
        document_submit: {
            type: Sequelize.BOOLEAN,
        },
        event_comment: {
            type: Sequelize.BOOLEAN,
        },
        event_submit: {
            type: Sequelize.BOOLEAN,
        },
        event_acceptance: {
            type: Sequelize.BOOLEAN,
        },
        event_rejection: {
            type: Sequelize.BOOLEAN,
        },
        document_rejection: {
            type: Sequelize.BOOLEAN,
        },
        notify_email: {
            type: Sequelize.BOOLEAN,
        },
        status: {
            type: Sequelize.BOOLEAN,
        },
    })

    return NotificationSetting
}
