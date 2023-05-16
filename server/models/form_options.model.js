module.exports = (sequelize, Sequelize) => {
    const FormOptions = sequelize.define("form_options", {
        options: {
            type: Sequelize.JSON
        }
    });

    return FormOptions;
};
