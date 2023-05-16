module.exports = (sequelize, Sequelize) => {
    const SmartContractProposalChannel = sequelize.define('smart_contract_proposal_channel', {
        channel_id: {
            type: Sequelize.INTEGER,
        },
        proposal_name: {
            type: Sequelize.STRING,
            unique: true
        }
    })

    return SmartContractProposalChannel
}
