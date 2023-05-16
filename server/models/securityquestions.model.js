module.exports = (sequelize, Sequelize) => {
    const SecurityQuestions = sequelize.define('security_questions', {
        questions: {
            type: Sequelize.STRING,
        },
        local_questions: {
            type: Sequelize.STRING,
        },
    })

    return SecurityQuestions
}
