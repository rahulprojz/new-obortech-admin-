module.exports = (sequelize, Sequelize) => {
    const ChannelGitHubDetail = sequelize.define('channel_github_detail', {
        host_organization: {
            type: Sequelize.INTEGER,
        },
        channel_name: {
            type: Sequelize.STRING,
            unique: true
        },
        repository_name: {
            type: Sequelize.STRING
        },
        repository_owner: {
            type: Sequelize.STRING
        }
    })

    return ChannelGitHubDetail
}
