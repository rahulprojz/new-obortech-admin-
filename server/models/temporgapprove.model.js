module.exports = (sequelize, Sequelize) => {
    const TempOrgApprove = sequelize.define("temp_org_approve", {
        org_id: {
            type: Sequelize.INTEGER
        },
        org_name: {
            type: Sequelize.STRING
        },
        cron_id: {
            type: Sequelize.INTEGER
        },
        msp_type: {
            type: Sequelize.INTEGER
        }
    }, {
        tableName: 'temp_org_approve'
    });

    return TempOrgApprove;
};