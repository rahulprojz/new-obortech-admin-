module.exports = (sequelize, Sequelize) => {
    const DocumentAcceptedUser = sequelize.define('document_accepted_user', {
        project_event_id: {
            type: Sequelize.STRING,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        is_rejected: {
            type: Sequelize.INTEGER,
        },
    })
    return DocumentAcceptedUser
}
