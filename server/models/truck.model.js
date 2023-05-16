module.exports = (sequelize, Sequelize) => {
    const Truck = sequelize.define("truck", {
        truckID: {
            type: Sequelize.STRING
        },
        is_available:{
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
    });
    return Truck;
};