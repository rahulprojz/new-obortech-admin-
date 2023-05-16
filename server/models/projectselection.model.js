module.exports = (sequelize, Sequelize) => {
    const ProjectSelection = sequelize.define("project_selection", {
        project_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectSelection;
};