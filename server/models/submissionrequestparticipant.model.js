module.exports = (sequelize, Sequelize) => {
    const SubmissionRequestParticipant = sequelize.define("submission_request_participant", {
        participant_id: {
            type: Sequelize.INTEGER
        },
        submission_id: {
            type: Sequelize.INTEGER
        }
    });
    return SubmissionRequestParticipant;
};
