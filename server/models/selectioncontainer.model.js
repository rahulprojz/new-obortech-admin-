module.exports = (sequelize, Sequelize) => {
    const SelectionContainer = sequelize.define("selection_container", {
        selection_id: {
            type: Sequelize.INTEGER
        },
        container_id: {
            type: Sequelize.INTEGER
        }
    });
    
    return SelectionContainer;
};