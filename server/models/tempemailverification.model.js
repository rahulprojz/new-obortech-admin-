module.exports = (sequelize, Sequelize) => {
    const TempEmailVerification = sequelize.define('temp_email_verifications', {
        email: {
            type: Sequelize.STRING,
        },
        otp: {
            type: Sequelize.STRING,
        },
    })

    return TempEmailVerification
}
