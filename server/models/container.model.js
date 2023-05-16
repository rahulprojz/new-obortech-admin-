module.exports = (sequelize, Sequelize) => {
    const Container = sequelize.define('container', {
        containerID: {
            type: Sequelize.STRING,
        },
        is_available: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
        unique_code: {
            type: Sequelize.STRING,
        },
        manual_code: {
            type: Sequelize.STRING,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    })

    Container.associate = (models) => {
        Container.belongsTo(models.truck, { through: models.truck_container })
    }

    return Container
}
