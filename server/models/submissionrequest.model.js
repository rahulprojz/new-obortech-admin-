module.exports = (sequelize, Sequelize) => {
    const SubmissionRequest = sequelize.define("submission_request", {
        user_id: {
            type: Sequelize.INTEGER
        },
        worker_id: {
            type: Sequelize.INTEGER
        },
        project_id: {
            type: Sequelize.INTEGER
        },
        project_event_id: {
            type: Sequelize.INTEGER
        },
        container_id: {
            type: Sequelize.INTEGER
        },
        item_id: {
            type: Sequelize.INTEGER
        },
        event_id: {
            type: Sequelize.STRING
        },
        event_type: {
            type: Sequelize.STRING
        },
        is_viewed: {
            type: Sequelize.INTEGER
        },
        is_submitted: {
            type: Sequelize.INTEGER
        }
    });
    return SubmissionRequest;
};
