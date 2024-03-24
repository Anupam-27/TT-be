module.exports = (sequelize, Sequelize) => {
    const Email = sequelize.define(
        "emails",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(80),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'email'] // Specify composite key columns
                }
            ],
            freezeTableName: true,
            timestamps: true,
            paranoid: true,
            deletedAt: `deleted_at`,
            createdAt: `created_at`,
            updatedAt: `updated_at`,
        }
    );
    return Email;
};