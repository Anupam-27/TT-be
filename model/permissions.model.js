module.exports = (sequelize, Sequelize) => {
    const Permissions = sequelize.define(
        "permissions",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(22),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE
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
    return Permissions;
};