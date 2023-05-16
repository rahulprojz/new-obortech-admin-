module.exports = (sequelize, Sequelize) => {
    const SubmissionRequestDocumentParticipant = sequelize.define("submission_request_document_participants", {
        submission_id: {
            type: Sequelize.INTEGER
        },
        participant_id: {
            type: Sequelize.INTEGER
        }
    });
    return SubmissionRequestDocumentParticipant;
};
