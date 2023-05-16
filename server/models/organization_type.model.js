module.exports = (sequelize, Sequelize) => {
    const Organization = sequelize.define("organization_type", {
        name: {
            type: Sequelize.STRING
        }
    });
    return Organization;
};
