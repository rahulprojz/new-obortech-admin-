module.exports = (sequelize, Sequelize) => {
    const ProjectSubEvents = sequelize.define('project_sub_events', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
        },
        parent_event_id: {
            type: Sequelize.STRING,
        },
        sub_event_id: {
            type: Sequelize.STRING,
        },
    })

    return ProjectSubEvents
}
