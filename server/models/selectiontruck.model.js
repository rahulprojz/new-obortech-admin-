module.exports = (sequelize, Sequelize) => {
    const SelectionTruck = sequelize.define("selection_truck", {
        selection_id: {
            type: Sequelize.INTEGER
        },
        truck_id: {
            type: Sequelize.INTEGER
        }
    });

    return SelectionTruck;
};