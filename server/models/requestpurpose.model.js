module.exports = (sequelize, Sequelize) => {
    const RequestPurpose = sequelize.define('request_purpose', {
        purpose_key: {
            type: Sequelize.STRING,
        },
        purpose_value: {
            type: Sequelize.STRING,
        },
    })
    return RequestPurpose
}
