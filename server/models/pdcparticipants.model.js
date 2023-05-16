module.exports = (sequelize, Sequelize) => {
    const PdcParticipants = sequelize.define('pdc_participants', {
        pdc_id: {
            type: Sequelize.INTEGER,
        },
        participant_id: {
            type: Sequelize.INTEGER,
        },
    })
    return PdcParticipants
}
