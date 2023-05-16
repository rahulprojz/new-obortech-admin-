module.exports = (sequelize, Sequelize) => {
    const SelectionGroup = sequelize.define("selection_group", {
        selection_id: {
            type: Sequelize.INTEGER
        },
        group_id: {
            type: Sequelize.INTEGER
        }
    });
    
    return SelectionGroup;
};