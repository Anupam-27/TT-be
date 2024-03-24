module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define(
        "roles",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(32),
                allowNull: false
            },
            permission_id: {
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
    return Role;
};