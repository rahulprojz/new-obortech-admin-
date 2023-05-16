module.exports = (sequelize, Sequelize) => {
    const PrivacyPolicy = sequelize.define('privacy_policy', {
        en_html: {
            type: Sequelize.BLOB('long'),
            allowNull: false,
            get() {
                return this.getDataValue('en_html') ? this.getDataValue('en_html').toString('utf8') : ''
            },
        },
        mn_html: {
            type: Sequelize.BLOB('long'),
            allowNull: false,
            get() {
                return this.getDataValue('mn_html') ? this.getDataValue('mn_html').toString('utf8') : ''
            },
        },
    })

    return PrivacyPolicy
}
