module.exports = (sequelize, Sequelize) => {
    const SelectionDevice = sequelize.define('selection_device', {
        selection_id: {
            type: Sequelize.INTEGER,
        },
        device_id: {
            type: Sequelize.INTEGER,
        },
        data_interval: {
            type: Sequelize.STRING,
        },
        is_stopped: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        is_started: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
    })
    return SelectionDevice
}
