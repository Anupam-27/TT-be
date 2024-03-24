const model = require("../model")
const TourPermission = model.tournament_permission
const Set = model.set
const Match = model.match
const Users = model.users
const Tournament = model.tournaments
const { Op } = require('sequelize');
const { createKnockoutDraw } = require("../utils/utils")
const { Sequelize } = require("../model")

let io;

const initialiseSocket = async (socket) => {
    io = socket
    io.on("invite_accepted", handleInviteSent)
}
const handleScoreUpdate = async (payload) => {
    const { match_id, set_number, score } = payload
    // console.log(payload, "score_update")
    await Set.update(
        {
            set_score: score
        },
        {
            where: {
                match_id: match_id,
                set_number: set_number
            }
        }
    )
    io.emit("broadcast_score")
}

const handleStartSet = async (payload) => {
    const { set_number, matchId, tourId } = payload
    console.log(payload, "payload")
    const setExists = await Set.count({
        where: {
            match_id: matchId,
            set_number: set_number
        }
    })
    // console.log(setExists, "setExists")
    if (!setExists) {
        await Set.create({
            match_id: matchId,
            set_number: set_number,
            status: 1
        })
        await Tournament.update({
            status: "Ongoing"
        },
            {
                where: {
                    id: tourId
                }
            })
    }
    io.emit("fetch_set_details")
}

const sendGeneraliseEvents = (payload) => {
    const { id, data, name } = payload
    if (id) {
        io.emit(name, data)
    } else {
        io.to(id).timeout(100).emit(name, data)
    }
}

const handleInviteSent = async ({ user_id, tour_id }) => {
    try {
        const result = await TourPermission.create({
            role_id: "[]",
            tour_id: tour_id,
            user_id: user_id
        })
        if (!result) {
            throw new Error("Something went wrong!")
        }
        // this event update the list of player list on FE if any user accepted the invite
        // in any tour to remove the date clashes
        io.emit("player_list_update", { user_id: user_id })
    } catch (err) {
        io.emit("connect_error", { err: err.message })
    }
}

const sendInvitation = async (data) => {
    try {
        const { tourId, userIds } = data
        for await (const user_id of userIds) {
            // console.log(user_id)
            io.to(user_id).timeout(100).emit('invitation', { tourId, userId: user_id })
            console.log(user_id, "sendInvitation user_id")
        }
        // console.log(userIds)
        return true
    } catch (err) {
        console.log(err, "sendInvitation")
        return false;
    }
}

const handleFinishSet = async (data) => {
    const { matchId, set_number, winner } = data
    await Set.update({
        status: 2,
        result: winner
    },
        {
            where: {
                match_id: matchId,
                set_number: set_number
            }
        }
    )
    io.emit("fetch_set_details")
}

const handleFinishMatch = async (data) => {
    const { winner_id, match_id, curr_round, total_round, tourId } = data
    // console.log(data, "match finish")
    await Match.update({
        result: winner_id ? winner_id : 0,
        status: "Completed"
    }, {
        where: {
            id: match_id
        }
    })
    const count = await Match.count({
        where: {
            tour_id: tourId,
            curr_round: curr_round,
            result: null
        }
    })
    if (!count && curr_round < total_round) {
        const matches = await Match.findAll({
            attributes: ["result"],
            where: {
                tour_id: tourId,
                curr_round: curr_round,
                result: {
                    [Op.ne]: null
                }
            },
            raw: true
        })
        // console.log(matches)

        const userIds = matches.map((_val) => _val.result)
        const userDetails = await Users.findAll({
            where: {
                id: {
                    [Op.in]: userIds
                }
            },
            raw: true
        })
        if (userDetails.length > 1) {
            const newMatches = createKnockoutDraw(userDetails)
            if (newMatches.length) {
                for (let j = 0; j < newMatches.length; j++) {
                    // console.log(newMatches[j], "yes")
                    let payload = {
                        tour_id: tourId,
                        player_ids: newMatches[j],
                        curr_round: curr_round + 1
                    }
                    // console.log(payload, "new payload")
                    if (newMatches[j].includes("Bye")) {
                        payload.result = parseInt(newMatches[j].split("/")[1].split("-")[1])
                    }
                    await Match.create(payload)
                }
            }
        }
    } else if (!count && curr_round == total_round) {
        const maxMatchesWinnerQuery = await Match.findOne({
            attributes: ['result', [Sequelize.fn('COUNT', Sequelize.col('result')), 'count']],
            group: ['result'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('result')), 'DESC']],
            where: {
                tour_id: tourId
            },
            raw: true
        });
        console.log(maxMatchesWinnerQuery, "maxMatchesWinnerQuery")
        await Tournament.update(
            {
                status: "Completed",
                winner: maxMatchesWinnerQuery.result
            },
            {
                where: {
                    id: tourId
                }
            })
        io.emit("fetchTournament")
    }
    io.emit("fetchMatch")
}

module.exports = {
    sendInvitation,
    handleInviteSent,
    initialiseSocket,
    sendGeneraliseEvents,
    handleScoreUpdate,
    handleStartSet,
    handleFinishSet,
    handleFinishMatch
}