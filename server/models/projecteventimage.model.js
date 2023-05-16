module.exports = (sequelize, Sequelize) => {
    const ProjectEventImage = sequelize.define('project_event_image', {
        project_event_id: {
            type: Sequelize.STRING,
        },
        image_name: {
            type: Sequelize.STRING,
        },
    })

    return ProjectEventImage
}
