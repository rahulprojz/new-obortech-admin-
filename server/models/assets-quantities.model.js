module.exports = (sequelize, Sequelize) => {
    const AssetsQuantity = sequelize.define('assets_quantities', {
        asset_code: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        available_quantity: {
            type: Sequelize.INTEGER,
        },
        transferred_quantity: {
            type: Sequelize.INTEGER,
        },
        created_quantity: {
            type: Sequelize.INTEGER,
        },
        removed_quantity: {
            type: Sequelize.INTEGER,
        },
    })

    return AssetsQuantity
}
