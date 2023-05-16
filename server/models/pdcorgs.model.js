module.exports = (sequelize, Sequelize) => {
    const PdcOrganization = sequelize.define('pdc_orgs', {
        pdc_id: {
            type: Sequelize.INTEGER,
        },
        org_id: {
            type: Sequelize.INTEGER,
        },
    })
    return PdcOrganization
}
