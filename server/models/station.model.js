module.exports = (sequelize, Sequelize) => {
    const Road = sequelize.define('station', {
        name: {
            type: Sequelize.STRING,
        },
        latitude: {
            type: Sequelize.STRING,
        },
        longitude: {
            type: Sequelize.STRING,
        },
        radius: {
            type: Sequelize.STRING,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: 1,
        },
        organization_id: {
            type: Sequelize.INTEGER,
        },
        paths: {
            type: Sequelize.TEXT,
        },
    })
    return Road
}
