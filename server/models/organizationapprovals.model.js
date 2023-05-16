module.exports = (sequelize, Sequelize) => {
    const Organization_approvals = sequelize.define(
        'organization_approval',
        {
            organization_id: {
                type: Sequelize.INTEGER,
            },
            approved_by: {
                type: Sequelize.INTEGER,
            },
            isVerified: {
                type: Sequelize.BOOLEAN,
            },
        },
        {
            freezeTableName: true,
        },
    )
    return Organization_approvals
}
