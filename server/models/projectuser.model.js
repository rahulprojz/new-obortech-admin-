module.exports = (sequelize, Sequelize) => {
    const ProjectUser = sequelize.define("project_user", {
        project_id: {
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectUser;
};
