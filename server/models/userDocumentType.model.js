module.exports = (sequelize, Sequelize) => {
    const UserDocumentType = sequelize.define("user_document_type", {
        organization_document__id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }
    });

    return UserDocumentType;
};
