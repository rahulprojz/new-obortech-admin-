module.exports = (sequelize, Sequelize) => {
    const ProjectEventHideByUsers = sequelize.define('user_hidden_events', {
        project_event_id: {
            type: Sequelize.STRING,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
    })
    return ProjectEventHideByUsers
}
