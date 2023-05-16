module.exports = (sequelize, Sequelize) => {
    const User_Type = sequelize.define("user_type", {
        name: {
            type: Sequelize.STRING
        }
    });
    return User_Type;
};