module.exports = (sequelize, Sequelize) => {
    const SubmissionRequestRecipient = sequelize.define("submission_request_recipient", {
        worker_id: {
            type: Sequelize.INTEGER
        },
        submission_id: {
            type: Sequelize.INTEGER
        },
        is_submitted: {
            type: Sequelize.INTEGER
        }
    });
    return SubmissionRequestRecipient;
};
