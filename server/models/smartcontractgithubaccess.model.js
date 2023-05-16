module.exports = (sequelize, Sequelize) => {
    const SmartContractGithubAccess = sequelize.define('smart_contract_github_access', {
        organization_id: {
            type: Sequelize.INTEGER,
        },
        channel_id: {
            type: Sequelize.INTEGER,
        },
        invitation_id: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.ENUM('PENDING', 'REQUESTED', 'ACCEPTED', 'REJECTED'),
            defaultValue: 'PENDING',
        }
    })

    return SmartContractGithubAccess
}
