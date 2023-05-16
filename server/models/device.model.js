module.exports = (sequelize, Sequelize) => {
    const Device = sequelize.define("device", {
        vendor_id: {
            type: Sequelize.INTEGER
        },
        deviceID: {
            type: Sequelize.STRING
        },
        tag: {
            type: Sequelize.STRING,
        },
        is_available: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    });

    return Device;
};
