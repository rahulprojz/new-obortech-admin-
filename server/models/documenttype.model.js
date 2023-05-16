module.exports = (sequelize, Sequelize) => {
    const DocumentType = sequelize.define("document_type", {
        type: {
            type: Sequelize.STRING
        },
    });

    return DocumentType;
};
