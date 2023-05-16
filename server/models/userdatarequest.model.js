module.exports = (sequelize, Sequelize) => {
    const UserDataRequest = sequelize.define("user_data_request", {
        request_id: {
            type: Sequelize.STRING
        },
        processor_id: {
            type: Sequelize.STRING
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        purpose_id: {
            type: Sequelize.INTEGER
        },
        controller_id: {
            type: Sequelize.STRING
        },
        request_txn_id: {
            type: Sequelize.STRING
        },
        validity: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.STRING
        },
        status_description: {
            type: Sequelize.STRING
        },
        approved_by_dc: {
            type: Sequelize.BOOLEAN
        },
        approved_by_ds: {
            type: Sequelize.BOOLEAN
        },
        rejected_by_dc: {
            type: Sequelize.BOOLEAN
        },
        rejected_by_ds: {
            type: Sequelize.BOOLEAN
        },
        is_delete_request: {
            type: Sequelize.BOOLEAN
        },
        request_from: {
            type: Sequelize.STRING
        },
        org_approve_status: {
            type: Sequelize.BOOLEAN
        },
    });

    return UserDataRequest;
};
