module.exports = (sequelize, Sequelize) => {
    const Item = sequelize.define("apikey", {
        type: {
            type: Sequelize.STRING
        },
        value: {
            type: Sequelize.STRING
        }
    });

    return Item;
};