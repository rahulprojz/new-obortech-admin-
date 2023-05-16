module.exports = (sequelize, Sequelize) => {
    const FormAnswers = sequelize.define("project_event_answers", {
        user_id: {
            type: Sequelize.INTEGER
        },
        form_id:{
            type: Sequelize.INTEGER
        },
        project_event_id:{
            type: Sequelize.INTEGER
        },
        answers: {
            type: Sequelize.JSON
        }
    });

    return FormAnswers;
};
