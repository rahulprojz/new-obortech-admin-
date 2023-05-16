module.exports = (sequelize, Sequelize) => {
    const ProjectParticipant = sequelize.define("project_participant", {
        project_id: {
            type: Sequelize.INTEGER
        },
        participant_id: {
            type: Sequelize.INTEGER
        }
    });

    return ProjectParticipant;
};