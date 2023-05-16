module.exports = (sequelize, Sequelize) => {
    const NotificationSettingOrganization = sequelize.define("notification_setting_organization", {
        notification_settings_id: {
            type: Sequelize.INTEGER
        },
        organization_id: {
            type: Sequelize.INTEGER
        },
    });

    return NotificationSettingOrganization;
};
