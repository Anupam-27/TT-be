module.exports = (sequelize, Sequelize) => {
    const Matches = sequelize.define(
        "matches",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            tour_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('0', '1', '2'), //Upcoming, Ongoing, Completed
                defaultValue: '0'
            },
            result: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            player_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            curr_round: {
                type: Sequelize.INTEGER,
                allowNull: false
            }
        },
        {
            timestamps: true,
            paranoid: true,
        }
    );
    return Matches;
};