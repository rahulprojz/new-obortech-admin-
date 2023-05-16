module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('user', {
        unique_id: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        registration_number: {
            type: Sequelize.STRING,
        },
        role_id: {
            type: Sequelize.INTEGER,
        },
        title_id: {
            type: Sequelize.INTEGER,
        },
        isEmailVerified: {
            type: Sequelize.BOOLEAN,
        },
        isPhoneVerified: {
            type: Sequelize.BOOLEAN,
        },
        is_mvs_verified: {
            type: Sequelize.BOOLEAN,
        },
        added_to_network: {
            type: Sequelize.BOOLEAN,
        },
        isApproved: {
            type: Sequelize.BOOLEAN,
        },
        first_name: {
            type: Sequelize.STRING,
        },
        local_first_name: {
            type: Sequelize.STRING,
        },
        last_name: {
            type: Sequelize.STRING,
        },
        local_last_name: {
            type: Sequelize.STRING,
        },
        username: {
            type: Sequelize.STRING,
        },
        email: {
            type: Sequelize.STRING,
        },
        password: {
            type: Sequelize.STRING,
        },
        country_code: {
            type: Sequelize.STRING,
        },
        mobile: {
            type: Sequelize.STRING,
        },
        status: {
            type: Sequelize.BOOLEAN,
        },
        isTwoFactorAuth: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0,
        },
        isSMSAuth: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0,
        },
        language: {
            type: Sequelize.STRING,
            defaultValue: 'MN',
        },
        country_id: {
            type: Sequelize.INTEGER,
        },
        state_id: {
            type: Sequelize.INTEGER,
        },
        isDeleted: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        city_id: {
            type: Sequelize.INTEGER,
        },
    })
    return User
}
