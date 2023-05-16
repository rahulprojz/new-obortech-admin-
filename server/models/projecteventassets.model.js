module.exports = (sequelize, Sequelize) => {
    const ProjectEventImage = sequelize.define('project_event_assets', {
        assets_code: {
            type: Sequelize.INTEGER,
        },
        project_event_id: {
            type: Sequelize.STRING,
        },
        supplier_org_id: {
            type: Sequelize.INTEGER,
        },
        receiver_org_id: {
            type: Sequelize.INTEGER,
        },
        action: {
            type: Sequelize.STRING,
        },
        quantity: {
            type: Sequelize.INTEGER,
        },
    })

    return ProjectEventImage
}
