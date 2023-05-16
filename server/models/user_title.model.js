module.exports = (sequelize, Sequelize) => {
    const User_Title = sequelize.define("user_title", {
        name: {
            type: Sequelize.STRING
        }
    });
    return User_Title;
};