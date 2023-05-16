module.exports = (sequelize, Sequelize) => {
    const EventTranslations = sequelize.define("event_translations", {
        event_id: {
            type: Sequelize.INTEGER
        },
        name: {
            type: Sequelize.STRING
        },
        lang: {
            type: Sequelize.STRING(10),
        }
    }, {
        charset: 'utf8',
    });

    return EventTranslations;
};
