module.exports = (sequelize, Sequelize) => {
    const UserAgreement = sequelize.define('user_agreements', {
        user_id: {
            type: Sequelize.INTEGER,
        },
        agreement: {
            type: Sequelize.BLOB('long'),
            allowNull: false,
            get() {
                return this.getDataValue('agreement') ? this.getDataValue('agreement').toString('utf8') : ''
            },
        },
        file_hash: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    })

    return UserAgreement
}
