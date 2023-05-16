module.exports = (sequelize, Sequelize) => {
    const PolicyRequiredData = sequelize.define('policy_required_data', {
        policy_id: {
            type: Sequelize.STRING,
        },
        data_type: {
            type: Sequelize.STRING,
        },
    })

    return PolicyRequiredData
}
