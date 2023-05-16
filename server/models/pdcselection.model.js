module.exports = (sequelize, Sequelize) => {
    const PdcSelection = sequelize.define('pdc_selections', {
        pdc_category_id: {
            type: Sequelize.INTEGER,
        },
        selection_id: {
            type: Sequelize.STRING,
        },
    })
    return PdcSelection
}
