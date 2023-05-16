module.exports = (sequelize, Sequelize) => {
    const Country = sequelize.define('country', {
        name: {
            type: Sequelize.STRING,
        },
        code: {
            type: Sequelize.STRING,
        },
        phonecode: {
            type: Sequelize.INTEGER,
        },
    })

    return Country
}
