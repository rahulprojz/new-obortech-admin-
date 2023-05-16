module.exports = (sequelize, Sequelize) => {
    const ServerPerformance = sequelize.define('server_performace', {
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        },
    })
    return ServerPerformance
}
