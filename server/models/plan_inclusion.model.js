module.exports = (sequelize, Sequelize) => {
    const Plan_inclusion = sequelize.define("plan_inclusion", {
        subscription_id: {
            type: Sequelize.INTEGER
        },
        plan_key: {
            type: Sequelize.STRING
        },
        plan_value: {
            type: Sequelize.INTEGER
        },
        plan_type: {
            type: Sequelize.ENUM('CREDIT', 'DEBIT', 'CF'),
        }
    });
    return Plan_inclusion;
};
