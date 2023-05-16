module.exports = (sequelize, Sequelize) => {
    const TempNetworkEvent = sequelize.define("temp_network_event", {
        project_event_id: {
            type: Sequelize.STRING
        },
        event: {
            type: Sequelize.TEXT
        }
    });
    return TempNetworkEvent;
};
