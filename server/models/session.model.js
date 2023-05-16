module.exports = (sequelize, Sequelize) => {
    const Session = sequelize.define('session', {
        session_id: {
            type: Sequelize.STRING,
        },
        expires: {
            type: Sequelize.INTEGER,
        },
        data: {
            type: Sequelize.TEXT,
        },
    })

    return Session
}
