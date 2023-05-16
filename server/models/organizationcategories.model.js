module.exports = (sequelize, Sequelize) => {
    const OrganizationCategories = sequelize.define('organization_categories', {
        org_id: {
            type: Sequelize.INTEGER,
        },
        category_id: {
            type: Sequelize.INTEGER,
        },
    })

    return OrganizationCategories
}
