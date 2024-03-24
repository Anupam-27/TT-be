module.exports = (sequelize, Sequelize) => {
    const Sets = sequelize.define(
        "sets",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            match_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            status: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            result: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            score_one: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            score_two: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            set_number: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 1
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
            timestamps: true,
            paranoid: true,
            deletedAt: `deleted_at`,
            createdAt: `created_at`,
            updatedAt: `updated_at`,
        }
    );
    return Sets;
};