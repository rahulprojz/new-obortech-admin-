module.exports = (sequelize, Sequelize) => {
    const ProjectEventUser = sequelize.define('project_event_user', {
        project_event_id: {
            type: Sequelize.INTEGER,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        created_by: {
            type: Sequelize.INTEGER,
        },
        viewed: {
            type: Sequelize.BOOLEAN,
        },
        is_parent_event: {
            type: Sequelize.BOOLEAN,
            default: 0,
        },
    })

    return ProjectEventUser
}
