module.exports = (sequelize, Sequelize) => {
    const Group = sequelize.define('group', {
        groupID: {
            type: Sequelize.STRING,
        },
        is_available: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
        },
    })

    return Group
}
