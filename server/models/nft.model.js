module.exports = (sequelize, Sequelize) => {
    const Nft= sequelize.define('nft', {
        name: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.STRING,
        },
        image: {
            type: Sequelize.STRING,
        },
        owner: {
            type: Sequelize.STRING,
        },
        uri: {
            type: Sequelize.STRING,
        },
        token_id: {
            type: Sequelize.INTEGER,
        },
        timestamp: {
            type: Sequelize.INTEGER,
        },
        polygon_url: {
            type: Sequelize.STRING,
        }
    })
    return Nft
}