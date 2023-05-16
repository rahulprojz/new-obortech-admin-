module.exports = (sequelize, Sequelize) => {
    const TruckContainer = sequelize.define("truck_container", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        truckId: {
            type: Sequelize.INTEGER
        },
        containerId: {
            type: Sequelize.INTEGER
        }
    });

    return TruckContainer;
};