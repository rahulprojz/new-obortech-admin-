module.exports = (sequelize, Sequelize) => {
    const AssetsCategories = sequelize.define('assets_categories', {
        name: {
            type: Sequelize.STRING,
        },
        local_name: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
    })

    return AssetsCategories
}
