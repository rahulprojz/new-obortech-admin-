module.exports = (sequelize, Sequelize) => {
    const ProjectRoad = sequelize.define('project_road', {
        project_id: {
            type: Sequelize.INTEGER,
        },
        road_id: {
            type: Sequelize.INTEGER,
        },
        order: {
            type: Sequelize.INTEGER,
        },
        radius: {
            type: Sequelize.STRING,
        },
        paths: {
            type: Sequelize.TEXT,
        },
    })

    return ProjectRoad
}
