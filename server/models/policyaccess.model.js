module.exports = (sequelize, Sequelize) => {
    const PolicyAccess = sequelize.define('policy_access', {
        policy_id: {
            type: Sequelize.STRING,
        },
        access: {
            type: Sequelize.STRING,
        },
    })

    return PolicyAccess
}
