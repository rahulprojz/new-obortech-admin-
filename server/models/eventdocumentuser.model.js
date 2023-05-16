module.exports = (sequelize, Sequelize) => {
    const EventDocumentUser = sequelize.define("event_document_user", {
        project_event_id: {
            type: Sequelize.INTEGER
        },
        organization_id: {
            type: Sequelize.INTEGER
        }
    });
    return EventDocumentUser;
};
