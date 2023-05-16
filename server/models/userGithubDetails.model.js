module.exports = (sequelize, Sequelize) => {
    const UserGithubDetails = sequelize.define('user_github_details', {
        user_id: {
            type: Sequelize.INTEGER,
        },
        username: {
            type: Sequelize.STRING,
            unique: true
        },
        token: {
            type: Sequelize.STRING,
        },
        status: {
            type: Sequelize.STRING,
        },
    })

    return UserGithubDetails
}
