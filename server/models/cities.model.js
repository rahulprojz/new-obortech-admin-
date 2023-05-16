module.exports = (sequelize, Sequelize) => {
    const City = sequelize.define('city', {
        name: {
            type: Sequelize.STRING,
        },
        state_id: {
            type: Sequelize.INTEGER,
        },
    })

    return City
}
