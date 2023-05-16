module.exports = (sequelize, Sequelize) => {
    const ProjectEventStatus = sequelize.define('project_comment_status', {
        event_submission_id: {
            type: Sequelize.STRING,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        comment_id: {
            type: Sequelize.INTEGER,
        },
        is_viewed: {
            type: Sequelize.INTEGER,
        },
    })

    return ProjectEventStatus
}
