module.exports = (sequelize, Sequelize) => {
    const integrity_matrix = sequelize.define('integrity_matrix', {
        name: {
            type: Sequelize.STRING,
        },
        table: {
            type: Sequelize.STRING,
        },
        columns: {
            type: Sequelize.STRING,
        },
        type: {
            type: Sequelize.ENUM('local', 'ledger', 'couch'),
        },
    })

    return integrity_matrix
}
