module.exports = (sequelize, Sequelize) => {
    const ParticipantCategory = sequelize.define('participant_category', {
        name: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    })

    ParticipantCategory.associate = (models) => {
        ParticipantCategory.hasMany(models.participant)
    }

    return ParticipantCategory
}
