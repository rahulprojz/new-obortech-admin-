module.exports = (sequelize, Sequelize) => {
    const ProjectCategory = sequelize.define('project_category', {
        name: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    })

    return ProjectCategory
}
