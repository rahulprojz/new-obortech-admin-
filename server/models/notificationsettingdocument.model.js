module.exports = (sequelize, Sequelize) => {
    const NotificationSettingDocument = sequelize.define('notification_setting_document', {
        notification_settings_id: {
            type: Sequelize.INTEGER,
        },
        document_event_id: {
            type: Sequelize.STRING,
        },
    })

    return NotificationSettingDocument
}
