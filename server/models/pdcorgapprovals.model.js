module.exports = (sequelize, Sequelize) => {
    const PdcOrgApprovals = sequelize.define('pdc_org_approvals', {
        pdc_id: {
            type: Sequelize.INTEGER,
        },
        org_id: {
            type: Sequelize.INTEGER,
        },
        is_approved: {
            type: Sequelize.BOOLEAN,
        },
        is_deleted: {
            type: Sequelize.BOOLEAN,
        },
    })
    return PdcOrgApprovals
}
