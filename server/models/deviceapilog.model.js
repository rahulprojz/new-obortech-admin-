module.exports = (sequelize, Sequelize) => {
    const DeviceApiLog = sequelize.define("device_api_logs", {
        project_id: {
            type: Sequelize.INTEGER
        },
        device_name: {
            type: Sequelize.INTEGER
        },
        latitude: {
            type: Sequelize.STRING
        },
        longitude: {
            type: Sequelize.STRING
        },
        address: {
            type: Sequelize.STRING
        },
        provider: {
            type: Sequelize.STRING
        },
        temperature: {
            type: Sequelize.FLOAT
        },
        humidity: {
            type: Sequelize.FLOAT
        },
        ambience: {
            type: Sequelize.STRING
        }
    });
    return DeviceApiLog;
};
