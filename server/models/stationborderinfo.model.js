module.exports = (sequelize, Sequelize) => {
    const StationBorderInfo = sequelize.define("station_border_info", {
        station_id: {
            type: Sequelize.INTEGER
        },
        project_id: {
            type: Sequelize.INTEGER
        },
        group_id: {
            type: Sequelize.INTEGER
        },
        truck_id: {
            type: Sequelize.INTEGER
        },
        container_id: {
            type: Sequelize.INTEGER
        },
        item_id: {
            type: Sequelize.INTEGER
        },
        position: {
            type: Sequelize.STRING
        },
        travelled_distance: {
            type: Sequelize.FLOAT
        }
    }, {
        tableName: 'station_border_info'
    });

    return StationBorderInfo;
};