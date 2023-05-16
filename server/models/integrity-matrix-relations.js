module.exports = (sequelize, Sequelize) => {
    const integrity_matrix_relations = sequelize.define('integrity_matrix_relations', {
        integrity_matrix_id: {
            type: Sequelize.INTEGER,
        },
        child: {
            type: Sequelize.STRING,
        },
        foreign_key: {
            type: Sequelize.STRING,
        },
        columns: {
            type: Sequelize.STRING,
        },
    })

    return integrity_matrix_relations
}
