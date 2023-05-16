module.exports = (sequelize, Sequelize) => {
    const FieldUserType = sequelize.define("field_user_types", {
        name: {
            type: Sequelize.STRING
        }
    });
    return FieldUserType;
};