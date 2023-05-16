module.exports = (sequelize, Sequelize) => {
    const Item = sequelize.define('item', {
        itemID: {
            type: Sequelize.STRING,
        },
        qr_code: {
            type: Sequelize.STRING,
        },
        manual_code: {
            type: Sequelize.STRING,
        },
        is_available: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    })
    return Item
}
