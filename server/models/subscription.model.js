module.exports = (sequelize, Sequelize) => {
    const Subscription = sequelize.define('subscription', {
        organization_id: {
            type: Sequelize.INTEGER,
        },
        transaction_id: {
            type: Sequelize.STRING,
        },
        purchase_date: {
            type: Sequelize.DATE,
        },
        duration: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.BOOLEAN,
        },
        plan: {
            type: Sequelize.STRING,
        },
    })
    return Subscription
}
