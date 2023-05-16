module.exports = (sequelize, Sequelize) => {
    const ProjectEventComment = sequelize.define(
        'project_event_comment',
        {
            event_submission_id: {
                type: Sequelize.STRING,
            },
            user_id: {
                type: Sequelize.INTEGER,
            },
            comment: {
                type: Sequelize.STRING,
            },
        },
        {
            charset: 'utf8',
        },
    )

    return ProjectEventComment
}
