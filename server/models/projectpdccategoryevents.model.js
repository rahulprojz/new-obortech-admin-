module.exports = (sequelize, Sequelize) => {
    const ProjectPdcCategoryEvent = sequelize.define('project_pdc_category_event', {
        project_category_id: {
            type: Sequelize.INTEGER,
        },
        event_id: {
            type: Sequelize.STRING,
        },
        is_submit_selected: {
            type: Sequelize.BOOLEAN,
            default: 0,
        },
    })

    return ProjectPdcCategoryEvent
}
