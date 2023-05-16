module.exports = (sequelize, Sequelize) => {
    const DeviceVendor = sequelize.define("device_vendor", {
        name: {
            type: Sequelize.STRING
        },
        api_key: {
            type: Sequelize.STRING
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
    });

    return DeviceVendor;
};
