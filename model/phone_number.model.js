module.exports = (sequelize, Sequelize) => {
    const PhoneNumber = sequelize.define(
        "phone_numbers",
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
            phone_number: {
                type: Sequelize.BIGINT,
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
                    fields: ['user_id', 'phone_number'] // Specify composite key columns
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
    return PhoneNumber;
};