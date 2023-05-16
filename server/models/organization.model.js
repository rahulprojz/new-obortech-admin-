module.exports = (sequelize, Sequelize) => {
    const Organization = sequelize.define('organization', {
        unique_id: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        local_name: {
            type: Sequelize.STRING,
            defaultValue: '',
        },
        state_registration_id: {
            type: Sequelize.INTEGER,
        },
        country_id: {
            type: Sequelize.INTEGER,
        },
        city_id: {
            type: Sequelize.INTEGER,
        },
        state_id: {
            type: Sequelize.INTEGER,
        },
        is_mvs_verified: {
            type: Sequelize.BOOLEAN,
        },
        isDeleted: {
            type: Sequelize.INTEGER,
        },
        streetAddress: {
            type: Sequelize.STRING,
        },
        isApproved: {
            type: Sequelize.BOOLEAN,
        },
        type_id: {
            type: Sequelize.INTEGER,
        },
        category_id: {
            type: Sequelize.INTEGER,
        },
        organization_type_id: {
            type: Sequelize.INTEGER,
        },
        msp_type: {
            type: Sequelize.INTEGER,
        },
        ccp_name: {
            type: Sequelize.STRING,
        },
        sync_status: {
            type: Sequelize.INTEGER,
        },
        invited_by: {
            type: Sequelize.INTEGER,
        },
        blockchain_name: {
            type: Sequelize.STRING,
        },
    })
    return Organization
}
