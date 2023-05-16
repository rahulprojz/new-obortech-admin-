module.exports = (sequelize, Sequelize) => {
    const TempNumberVerificaiton = sequelize.define("temp_number_verification", {
        number: {
            type: Sequelize.STRING
        },
        otp: {
            type: Sequelize.STRING
        }
    });

    return TempNumberVerificaiton;
};