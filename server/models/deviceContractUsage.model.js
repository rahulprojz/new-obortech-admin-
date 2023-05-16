module.exports = (sequelize, Sequelize) => {
    const DeviceContractUsage = sequelize.define('device_contract_usage', {
        device_contract_id: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.ENUM('DEBIT'),
        },
    })
    return DeviceContractUsage
}
