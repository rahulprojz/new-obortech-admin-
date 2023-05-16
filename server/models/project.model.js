const ShortUniqueId = require('short-unique-id')

module.exports = (sequelize, Sequelize) => {
    const Project = sequelize.define(
        'project',
        {
            name: {
                type: Sequelize.STRING,
            },
            uniqueId: {
                type: Sequelize.STRING,
            },
            project_category_id: {
                type: Sequelize.INTEGER,
            },
            document_category_id: {
                type: Sequelize.INTEGER,
            },
            temperature_alert_min: {
                type: Sequelize.STRING,
            },
            temperature_alert_max: {
                type: Sequelize.STRING,
            },
            temperature_alert_interval: {
                type: Sequelize.STRING,
            },
            temperature_allowed_occurances: {
                type: Sequelize.STRING,
            },
            humidity_alert_min: {
                type: Sequelize.STRING,
            },
            humidity_alert_max: {
                type: Sequelize.STRING,
            },
            humidity_alert_interval: {
                type: Sequelize.STRING,
            },
            humidity_allowed_occurances: {
                type: Sequelize.STRING,
            },
            ambience_threshold: {
                type: Sequelize.STRING,
            },
            isDraft: {
                type: Sequelize.INTEGER,
            },
            is_completed: {
                type: Sequelize.INTEGER,
            },
            completed_date: {
                type: Sequelize.DATE,
            },
            isActive: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            archived: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            is_readonly: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            integrity_status: {
                type: Sequelize.INTEGER,
            },
            integrity_error: {
                type: Sequelize.STRING,
            },
            integrity_checked_at: {
                type: Sequelize.DATE,
            },
            alert_type: {
                type: Sequelize.INTEGER,
            },
            pdc_name: {
                type: Sequelize.STRING,
            },
            custom_labels: {
                type: Sequelize.TEXT,
            },
            user_id: {
                type: Sequelize.INTEGER,
            },
        },
        {
            hooks: {
                beforeCreate: (record) => {
                    const uniqueCode = new ShortUniqueId({ length: 8, dictionary: 'alpha_lower' })
                    record.dataValues.uniqueId = uniqueCode()
                },
            },
        },
    )
    Project.associate = (models) => {
        Project.hasMany(models.project_selection)
    }
    return Project
}
