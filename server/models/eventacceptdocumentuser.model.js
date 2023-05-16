module.exports = (sequelize, Sequelize) => {
    const EventAcceptDocumentUser = sequelize.define('event_accept_document_user', {
        project_event_id: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
    })
    return EventAcceptDocumentUser
}
