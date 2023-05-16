module.exports = (sequelize, Sequelize) => {
    const Worker = sequelize.define("worker", {
        user_id: {
            type: Sequelize.INTEGER
        },
        role_id: {
            type: Sequelize.INTEGER
        },
        first_name: {
            type: Sequelize.STRING
        },
        last_name: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        username: {
            type: Sequelize.STRING
        },
        phone: {
            type: Sequelize.STRING,
        },
        isActive: {
            type: Sequelize.INTEGER
        },
        otp: {
            type: Sequelize.STRING
        },
        is_verified: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        country_code: {
            type: Sequelize.STRING
        }
    });
    return Worker;
};
