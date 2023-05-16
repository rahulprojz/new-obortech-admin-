module.exports = (sequelize, Sequelize) => {
    const ProjectDocumentCategory = sequelize.define("project_participant_categories", {
        project_category_id: {
            type: Sequelize.INTEGER
        },
        participant_category_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectDocumentCategory;
};