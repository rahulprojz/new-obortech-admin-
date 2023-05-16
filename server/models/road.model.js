module.exports = (sequelize, Sequelize) => {
    const Road = sequelize.define("road", {
        name: {
            type: Sequelize.STRING
        },
        latitude: {
            type: Sequelize.STRING
        },
        longitude: {
            type: Sequelize.STRING
        },
        radius: {
            type: Sequelize.STRING
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: 1
        }
    });
    return Road;
};