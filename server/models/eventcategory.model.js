module.exports = (sequelize, Sequelize) => {
	const EventCategory = sequelize.define("event_category", {
		name: {
			type: Sequelize.STRING,
		},
		isReadOnly: {
			type: Sequelize.INTEGER,
		},
		organization_id: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
	});

	return EventCategory;
};