module.exports = (sequelize, Sequelize) => {
    const Tournaments = sequelize.define(
        "tournaments",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            photo: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            start_date_time: {
                type: Sequelize.DATE,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('0', '1', '2'),//Upcoming, Ongoing, Completed
                defaultValue: '0'
            },
            registration_end_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('0', '1'), //public, private
                allowNull: false,
                defaultValue: '0'
            },
            total_rounds: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            winner: {
                type: Sequelize.INTEGER,
                allowNull: true
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
    return Tournaments;
};