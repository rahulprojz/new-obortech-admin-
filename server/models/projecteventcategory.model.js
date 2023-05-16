module.exports = (sequelize, Sequelize) => {
    const ProjectEventCategory = sequelize.define("project_event_category", {
        project_category_id: {
            type: Sequelize.INTEGER
        },
        event_category_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectEventCategory;
};