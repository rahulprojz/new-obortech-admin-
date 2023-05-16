module.exports = (sequelize, Sequelize) => {
    const ProjectSidebarFolder = sequelize.define('project_sidebar_folders', {
        project_id: {
            type: Sequelize.INTEGER,
            defaultValue: null,
        },
        name: {
            type: Sequelize.STRING,
            defaultValue: null,
        },
        parent: {
            type: Sequelize.INTEGER,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        position: {
            type: Sequelize.INTEGER,
            defaultValue: null,
        },
    })

    return ProjectSidebarFolder
}
