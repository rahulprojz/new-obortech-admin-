module.exports = (sequelize, Sequelize) => {
    const InventoryAssets = sequelize.define('inventory_assets', {
        name: {
            type: Sequelize.STRING,
        },
        local_name: {
            type: Sequelize.STRING,
        },
        asset_code: {
            type: Sequelize.STRING,
        },
        asset_category_id: {
            type: Sequelize.STRING,
        },
        measurement: {
            type: Sequelize.STRING,
        },
        subinfo: {
            type: Sequelize.INTEGER,
        },
        is_viewed: {
            type: Sequelize.BOOLEAN,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
    })

    return InventoryAssets
}
