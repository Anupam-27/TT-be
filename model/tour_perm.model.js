module.exports = (sequelize, Sequelize) => {
    const TourPermission = sequelize.define(
        "tournament_permission",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            tour_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
            },
            updated_at: {
                type: Sequelize.DATE,
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        },
        {
            freezeTableName: true,
            timestamps: true,
            paranoid: true,
            deletedAt: `deleted_at`,
            createdAt: `created_at`,
            updatedAt: `updated_at`,
        }
    );
    return TourPermission;
};