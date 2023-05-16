module.exports = (sequelize, Sequelize) => {
    const UserSecurityAnswers = sequelize.define('user_security_answers', {
        user_id: {
            type: Sequelize.INTEGER,
        },
        question_id: {
            type: Sequelize.INTEGER,
        },
        answer: {
            type: Sequelize.STRING,
        },
    })

    return UserSecurityAnswers
}
