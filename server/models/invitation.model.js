module.exports = (sequelize, Sequelize) => {
    const Invitation = sequelize.define('invitation', {
        first_name: {
            type: Sequelize.STRING,
        },
        last_name: {
            type: Sequelize.STRING,
        },
        email: {
            type: Sequelize.STRING,
        },
        invitation_link: {
            type: Sequelize.TEXT('long'),
        },
        invited_by: {
            type: Sequelize.INTEGER,
        },
        invitationExpired: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        organization_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        invitation_type: {
            type: Sequelize.STRING,
        },
        language: {
            type: Sequelize.STRING(2),
        },
    })
    return Invitation
}
