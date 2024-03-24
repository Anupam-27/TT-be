module.exports = (sequelize, Sequelize) => {
    const Users = sequelize.define(
        "users",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            fullname: {
                type: Sequelize.STRING(32),
                allowNull: false
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            photo: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            age: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            gender: {
                type: Sequelize.ENUM('0', '1', '2'),
                defaultValue: null,
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
            timestamps: true,
            paranoid: true,
            deletedAt: `deleted_at`,
            createdAt: `created_at`,
            updatedAt: `updated_at`,
        }
    );
    return Users;
};


// deletedAt: `deleted_at`,
// createdAt: `created_at`,
// updatedAt: `updated_at`,