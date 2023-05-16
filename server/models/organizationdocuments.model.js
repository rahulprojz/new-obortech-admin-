module.exports = (sequelize, Sequelize) => {
    const OrganizationDocument = sequelize.define("organization_document", {
        organization_id: {
            type: Sequelize.INTEGER
        },
        type_id: {
            type: Sequelize.INTEGER
        },
        name: {
            type: Sequelize.STRING
        },
        hash: {
            type: Sequelize.STRING
        }
    });
    return OrganizationDocument;
};
