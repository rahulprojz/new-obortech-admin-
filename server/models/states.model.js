module.exports = (sequelize, Sequelize) => {
    const State = sequelize.define('state', {
        name: {
            type: Sequelize.STRING,
        },
        country_id: {
            type: Sequelize.INTEGER,
        },
    })

    return State
}
