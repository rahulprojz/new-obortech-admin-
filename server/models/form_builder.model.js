module.exports = (sequelize, Sequelize) => {
    const FormBuilder = sequelize.define("form_builder", {
        organization_id: {
			type: Sequelize.INTEGER,
		},
        formname: {
            type: Sequelize.STRING,
        },
        data: {
            type: Sequelize.JSON
        },
    });

    return FormBuilder;
};
