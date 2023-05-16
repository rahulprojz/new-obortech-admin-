module.exports = (sequelize, Sequelize) => {
    const DataUsagePolicy = sequelize.define('data_usage_policy', {
        policy_id: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.STRING,
        },
        purpose_id: {
            type: Sequelize.INTEGER,
        },
        clause: {
            type: Sequelize.STRING,
        },
        integrity_status: {
            type: Sequelize.INTEGER,
        },
        integrity_error: {
            type: Sequelize.STRING,
        },
        integrity_checked_at: {
            type: Sequelize.DATE,
        },
        validity: {
            type: Sequelize.INTEGER,
        },
    })
    return DataUsagePolicy
}
