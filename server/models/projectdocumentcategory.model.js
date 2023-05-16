module.exports = (sequelize, Sequelize) => {
    const ProjectDocumentCategory = sequelize.define("project_document_category", {
        project_category_id: {
            type: Sequelize.INTEGER
        },
        document_category_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectDocumentCategory;
};