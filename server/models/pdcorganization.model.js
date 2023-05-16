module.exports = (sequelize, Sequelize) => {
    const PdcOrganization = sequelize.define('pdc_organizations', {
        pdc_category_id: {
            type: Sequelize.INTEGER,
        },
        submit_user_id: {
            type: Sequelize.INTEGER,
        },
        see_user_id: {
            type: Sequelize.INTEGER,
        },
        event_id: {
            type: Sequelize.STRING,
        },
        accept_user_id: {
            type: Sequelize.INTEGER,
        },
        is_approved: {
            type: Sequelize.INTEGER(1),
            defaultValue: 0,
        },
        is_deleted: {
            type: Sequelize.INTEGER(1),
            defaultValue: 0,
        },
    })
    return PdcOrganization
}
