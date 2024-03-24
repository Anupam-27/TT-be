const schedule = require("node-schedule");
const model = require("../model")
const Tournaments = model.tournaments
const Users = model.users
const Matches = model.match
const TourPermission = model.tournament_permission
const Set = model.set
const { Op } = require('sequelize');
const { createKnockoutDraw } = require("./utils");
const { sendGeneraliseEvents } = require("../controllers/socket.controller");

const TransactionScheduler = async () => {
    // 14,29,44,59
    return schedule.scheduleJob('14,29,44,59 * * * *', async () => {
        try {
            // const date = new Date().toLocaleString()
            const currentDateTime = new Date().toLocaleString();

            // Calculate the current date and time plus 15 minutes
            const currentDateObject = new Date();
            currentDateObject.setMinutes(currentDateObject.getMinutes() + 16);

            // Check if the addition of 15 minutes goes beyond 60 minutes
            if (currentDateObject.getMinutes() >= 60) {
                currentDateObject.setHours(currentDateObject.getHours() + 1);
                currentDateObject.setMinutes(currentDateObject.getMinutes() - 60);
            }

            const currentPlus15Minutes = currentDateObject.toLocaleString();
            const start_time = currentDateTime.split(",")[1].slice(1, -3)
            const end_time = currentPlus15Minutes.split(",")[1].slice(1, -3)

            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            let formattedDate = `${year}-${month}-${day}`;
            formattedDate = new Date(formattedDate)
            const allTours = await Tournaments.findAll({
                where: {
                    start_date: formattedDate,
                    start_time: {
                        [Op.between]: [start_time, end_time]
                    }
                },
                raw: true
            })
            console.log(
                formattedDate,
                [start_time, end_time]
            )
            const allTourIds = allTours.map((_val) => _val.id)
            console.log(allTourIds, "allTourIds")
            if (allTourIds) {
                for (let i = 0; i < allTourIds.length; i++) {
                    let userIds = await TourPermission.findAll({
                        attributes: ["user_id"],
                        where: {
                            tour_id: allTourIds[i]
                        },
                        raw: true
                    })
                    if (userIds.length) {
                        userIds = userIds.map((_val) => _val.user_id)
                        const userDetails = await Users.findAll({
                            where: {
                                id: {
                                    [Op.in]: userIds
                                }
                            },
                            raw: true
                        })
                        console.log(userDetails, "userIds")
                        if (userDetails.length > 1) {
                            const totalPlayer = userIds.length
                            const totalRounds = Math.ceil(Math.log2(totalPlayer))
                            const matches = createKnockoutDraw(userDetails)
                            console.log(matches, totalRounds, "totalRounds")
                            Tournaments.update({
                                total_rounds: totalRounds
                            },
                                {
                                    where: {
                                        id: allTourIds[i]
                                    }
                                }).then(async (result) => {
                                    if (result) {
                                        if (matches.length) {
                                            for (let j = 0; j < matches.length; j++) {
                                                console.log(matches[j], "yes")
                                                let payload = {
                                                    tour_id: allTourIds[i],
                                                    player_ids: matches[j],
                                                    curr_round: 1
                                                }
                                                if (matches[j].includes("Bye")) {
                                                    payload.result = parseInt(matches[j].split("/")[1].split("-")[1])
                                                }
                                                await Matches.create(payload)
                                            }
                                            TourPermission.destroy({
                                                where: {
                                                    tour_id: allTourIds[i]
                                                }
                                            }).then((result) => {
                                                console.log(result, allTourIds[i], "deleted result")
                                            }).catch(err => {
                                                console.log(err)
                                            })
                                            sendGeneraliseEvents('matches_created', { tourId: allTourIds[i] })
                                        }
                                    }
                                }).catch(err => {
                                    console.log(err)
                                })

                        } else {
                            sendGeneraliseEvents(allTours[i].created_by, 'less_players', { tourId: allTourIds[i] })
                        }
                    }
                }
            }
            console.log(allTours, "allTours")
        } catch (err) {
            console.log(err)
        }
    })
}

module.exports = {
    TransactionScheduler
}