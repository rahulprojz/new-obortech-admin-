module.exports = (sequelize, Sequelize) => {
    const Event = sequelize.define('event', {
        uniqId: {
            type: Sequelize.INTEGER,
        },
        event_category_id: {
            type: Sequelize.INTEGER,
        },
        eventName: {
            type: Sequelize.STRING,
        },
        mongolianName: {
            type: Sequelize.STRING,
        },
        eventType: {
            type: Sequelize.STRING,
            defaultValue: 'event',
        },
        form_id: {
            type: Sequelize.STRING,
        },
        deadline_hours: {
            type: Sequelize.INTEGER,
        },
        integrity_status: {
            type: Sequelize.INTEGER,
        },
        integrity_error: {
            type: Sequelize.STRING,
        },
        integrity_checked_at: {
            type: Sequelize.DATE,
        },
    })

    return Event
}
