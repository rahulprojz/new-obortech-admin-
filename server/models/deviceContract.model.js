module.exports = (sequelize, Sequelize) => {
    const DeviceContract = sequelize.define('device_contracts', {
        device_id: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        quantity: {
            type: Sequelize.INTEGER,
        },
        start_date: {
            type: Sequelize.DATE,
        },
        end_date: {
            type: Sequelize.DATE,
        },
        duration: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.BOOLEAN,
        },
        type: {
            type: Sequelize.ENUM('CREDIT', 'DEBIT'),
        },
    })
    return DeviceContract
}
