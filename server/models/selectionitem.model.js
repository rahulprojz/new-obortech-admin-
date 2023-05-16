module.exports = (sequelize, Sequelize) => {
    const SelectionItem = sequelize.define('selection_item', {
        selection_id: {
            type: Sequelize.INTEGER,
        },
        item_id: {
            type: Sequelize.INTEGER,
        },
        is_start: {
            type: Sequelize.INTEGER,
        },
        start_date_time: {
            type: Sequelize.DATE,
        },
    })

    return SelectionItem
}
