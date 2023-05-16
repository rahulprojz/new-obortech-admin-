module.exports = (sequelize, Sequelize) => {
    const Participant = sequelize.define("participant", {
        participant_category_id: {
            type: Sequelize.INTEGER
        },
        password: {
            type: Sequelize.STRING
        },
        username: {
            type: Sequelize.STRING
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: 2
        }
    });

    Participant.associate = models => {
        Participant.belongsTo(models.participant_category);
    }

    return Participant;
};
