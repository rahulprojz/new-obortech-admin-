module.exports = (sequelize, Sequelize) => {
    const NotificationSettingEvent = sequelize.define('notification_setting_event', {
        notification_settings_id: {
            type: Sequelize.INTEGER,
        },
        alert_event_id: {
            type: Sequelize.STRING,
        },
    })

    return NotificationSettingEvent
}
