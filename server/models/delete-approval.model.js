module.exports = (sequelize, Sequelize) => {
    const DeleteApproval = sequelize.define('delete_approval', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        module_id: {
            type: Sequelize.INTEGER,
        },
        deleted_by: {
            type: Sequelize.INTEGER,
        },
    })
    return DeleteApproval
}
