module.exports = (sequelize, Sequelize) => {
    const DocumentCategory = sequelize.define("document_category", {
        name: {
            type: Sequelize.STRING
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
    });

    return DocumentCategory;
};