module.exports = (sequelize, Sequelize) => {
    const ProjectPdcCategory = sequelize.define('project_pdc_category', {
        name: {
            type: Sequelize.STRING,
        },
        project_category_id: {
            type: Sequelize.INTEGER,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        pdc_name: {
            type: Sequelize.STRING,
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            default: 0,
        },
        user_ids: {
            type: Sequelize.JSON,
        },
        org_list: {
            type: Sequelize.JSON,
        },
        event_id: {
            type: Sequelize.STRING,
        },
        is_deleting: {
            type: Sequelize.BOOLEAN,
            default: 0,
        },
        is_default: {
            type: Sequelize.BOOLEAN,
            default: 0,
        },
    })

    return ProjectPdcCategory
}
