module.exports = (sequelize, Sequelize) => {
    const DocumentSeenUser = sequelize.define('document_seen_user', {
        event_submission_id: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
    })
    return DocumentSeenUser
}
