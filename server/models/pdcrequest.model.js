module.exports = (sequelize, Sequelize) => {
    const PdcRequest = sequelize.define('pdc_requests', {
        pdc_name: {
            type: Sequelize.STRING,
        },
        members: {
            type: Sequelize.JSON,
        },
        type: {
            type: Sequelize.BOOLEAN,
        },
        record_id: {
            type: Sequelize.INTEGER,
        },
        email: {
            type: Sequelize.BOOLEAN,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
    })
    return PdcRequest
}
