module.exports = (sequelize, Sequelize) => {
    const Languages = sequelize.define('languages', {
        name: {
            type: Sequelize.STRING,
        },
        code: {
            type: Sequelize.STRING,
        },
        json: {
            type: Sequelize.JSON,
        },
    })
    return Languages
}
