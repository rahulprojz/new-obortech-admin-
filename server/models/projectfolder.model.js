module.exports = (sequelize, Sequelize) => {
    const ProjectFolder = sequelize.define("project_folder", {
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
            defaultValue: 0,
        },
        user_id: {
            type: Sequelize.INTEGER,
        }
    });

    return ProjectFolder;
};
