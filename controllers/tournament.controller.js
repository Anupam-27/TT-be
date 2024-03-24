const validateRequest = require("../middleware/validateRequest")
const model = require("../model")
const { generateImageVariants } = require("../utils/imageGenerator")
const S3 = require("../utils/s3")
const { sendInvitation } = require("./socket.controller")
const Tournaments = model.tournaments
const TourPermission = model.tournament_permission
const Matches = model.match
const Set = model.set
const Users = model.users
const { Op } = require('sequelize')

const keys = ["sm", "md", "lg"]
exports.getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournaments.findAll({
            where: {
                deleted_at: null
            }
        })
        return validateRequest.returnResponse(
            req,
            res,
            200,
            'Tournaments list',
            "getTournaments",
            tournaments
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "getTournaments",
        )
    }
}

exports.createTournaments = async (req, res) => {
    try {
        const userId = req.user.id
        await Tournaments.create({
            name: req.body.name,
            start_date: req.body.start_date,
            registration_end_date: req.body.reg_end_date,
            type: req.body.type,
            created_by: userId,
            start_time: req.body.start_time
        }).then(async (data) => {
            console.log(data)
            if (data) {
                const image_key = `${data.id}_${Date.now()}`
                if (req.file) {
                    const images = await generateImageVariants(image_key, req.file)

                    const uploadPromises = images.map(async (variant) => {
                        const params = {
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: `tournament/${variant.name}`, // Adjust the path and file name
                            Body: variant.buffer,
                            ContentType: req.file.mimetype,
                            ACL: 'public-read'
                        };

                        return S3.upload(params).promise();
                    });

                    const result = await Promise.all(uploadPromises);
                    // const imageData = []
                    // result.map((_val, idx) => {
                    //     imageData.push({ [`${keys[idx]}`]: `${image_key}_${keys[idx]}` })
                    // })
                    if (result) {
                        await Tournaments.update({
                            photo: image_key
                        },
                            {
                                where: {
                                    id: data.id
                                }
                            }
                        )
                    }
                }

                //update tour permission

                await TourPermission.create({
                    role_id: "[1,2]",
                    tour_id: data.id,
                    user_id: userId
                })

                return validateRequest.returnResponse(
                    req,
                    res,
                    200,
                    "tournament created successfully.",
                    "createTournaments",
                )
            }
        })


    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "createTournaments",
        )
    }
}

exports.updateTournaments = async (req, res) => {
    try {
        const tourId = req.params.id;
        if (!tourId) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Tournament id is required.",
                "deleteTournaments",
            )
        }
        const tourData = await Tournaments.findOne({
            where: {
                id: tourId
            }
        })
        if (!tourData) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Not able to delete this tournament.",
                "deleteTournaments",
            )
        }

        let payload = {
            name: req.body.name,
            start_date: req.body.start_date,
            registration_end_date: req.body.reg_end_date,
            type: req.body.type,
            start_time: req.body.start_time
        }
        if (req.file) {
            const image_key = `${tourId}_${Date.now()}`

            const images = await generateImageVariants(image_key, req.file)
            console.log(images)
            const deleteObj = images.map(async (variant) => {
                return await S3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `tournament/${variant.name}`
                }, function (err, data) { }).promise()
            })
            console.log(await Promise.all(deleteObj), "obj")
            deleteObj.map(async (variant) => {
                console.log(await variant)
            })

            const uploadPromises = images.map(async (variant) => {
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `tournament/${variant.name}`, // Adjust the path and file name
                    Body: variant.buffer,
                    ContentType: req.file.mimetype,
                    ACL: 'public-read'
                };

                return S3.upload(params).promise();
            });

            const result = await Promise.all(uploadPromises);
            // const images = await generateImageVariants(`${req.user.id}_${Date.now()}`, req.file)

            // const uploadPromises = images.map(async (variant) => {
            //     const params = {
            //         Bucket: process.env.AWS_BUCKET_NAME,
            //         Key: `tournament/${variant.name}`, // Adjust the path and file name
            //         Body: variant.buffer,
            //         ContentType: req.file.mimetype,
            //         ACL: 'public-read'
            //     };

            //     return S3.upload(params).promise();
            // });

            // const result = await Promise.all(uploadPromises);
            //console.log(result)
            const imageData = []
            result.map((_val) => {
                imageData.push({ [_val.Key]: _val.Location })
            })
            payload.photo = image_key
        }
        console.log(payload)
        await Tournaments.update(payload, {
            where: {
                id: tourId
            }
        }).then(user => {
            if (user) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    202,
                    "Tournament details updated.",
                    "updateTournaments",
                )
            }
            return validateRequest.returnResponse(
                req,
                res,
                500,
                `Something went wrong!`,
                "updateTournaments",
            )
        })
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "updateTournaments",
        )
    }
}

exports.deleteTournaments = async (req, res) => {
    try {
        const tourId = req.params.id;
        if (!tourId) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Tournament id is required.",
                "deleteTournaments",
            )
        }
        const tourData = await Tournaments.findOne({
            where: {
                id: tourId
            }
        })
        if (!tourData) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Not able to delete this tournament.",
                "deleteTournaments",
            )
        }

        await Tournaments.destroy({
            where: {
                id: tourId
            }
        }).then(() => {
            return validateRequest.returnResponse(
                req,
                res,
                202,
                "Tournament deleted successfull.",
                "deleteTournaments",
            )
        })
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "deleteTournaments",
        )
    }
}

exports.getDetails = async (req, res) => {
    try {
        const tourId = req.params.id;
        if (!tourId) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Tournament id is required.",
                "getTournament",
            )
        }
        await Tournaments.findOne({
            where: {
                id: tourId
            }
        })
            .then((data) => {
                // console.log(data, tourId)
                if (data) {
                    return validateRequest.returnResponse(
                        req,
                        res,
                        200,
                        "Tournament details.",
                        "getTournament",
                        data
                    )
                } else {
                    return validateRequest.returnResponse(
                        req,
                        res,
                        400,
                        "Not able to get details",
                        "getTournament",
                    )
                }
            })

    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "getTournament",
        )
    }
}

exports.createDraws = async (req, res) => {
    try {
        console.log(req.params)
        const data = {
            tourId: req.params.id,
            userIds: req.body.userIds
        }
        const isSent = sendInvitation(data)
        if (isSent) {
            return validateRequest.returnResponse(
                req,
                res,
                200,
                "Invitation sent to all user.",
                "createDraws",
            )
        } else {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Something went wrong in sending invitation.",
                "createDraws",
            )
        }
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "createDraws",
        )
    }
}

exports.getMatches = async (req, res) => {
    try {
        console.log(req.params.id, "yes")
        const tour_id = req.params.id
        if (!tour_id) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                `Check if tournament exists`,
                "fetchMatches",
            )
        }
        const matches = await Matches.findAll({
            attributes: {
                exclude: ["createdAt", "deletedAt", "updatedAt"]
            },
            where: {
                tour_id: tour_id
            },
            raw: true
        })
        return validateRequest.returnResponse(
            req,
            res,
            200,
            `Matches fetched successfull`,
            "fetchMatches",
            matches
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "fetchMatches",
        )
    }
}

exports.fetchMatch = async (req, res) => {
    try {
        const match_id = req.params.id
        if (!match_id) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                `No match found!`,
                "fetchMatch",
            )
        }

        const data = await Matches.findOne({
            attributes: {
                exclude: ["createdAt", "deletedAt", "updatedAt"]
            },
            where: {
                id: match_id
            },
            raw: true
        })
        const ids = data.player_ids.split("/").map((_val) => {
            return _val.split("-")[1]
        })

        const users = await Users.findAll({
            attributes: {
                exclude: ["created_at", "updated_at", "deleted_at", "provider_name", "password"]
            },
            where: {
                id: {
                    [Op.in]: ids
                }
            },
            raw: true
        })
        const response = {
            match: data,
            player1: users[0],
            player2: users[1]
        }
        console.log(users)

        return validateRequest.returnResponse(
            req,
            res,
            200,
            `Match details fetched.`,
            "fetchMatch",
            response
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "fetchMatch",
        )
    }
}

exports.getSetDetails = async (req, res) => {
    try {
        const matchId = req.params.id
        console.log(matchId, "matchId")
        if (!matchId) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                `This set might be completed.`,
                "getSetDetails",
            )
        }
        const setResult = await Set.findAll({
            where: {
                match_id: matchId,
                status: {
                    [Op.ne]: 0
                }
            },
            order: [['status', 'DESC']],
            raw: true
        })
        console.log(setResult, "setResult")
        return validateRequest.returnResponse(
            req,
            res,
            200,
            "Set details.",
            "getSetDetails",
            setResult
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "getSetDetails",
        )
    }
}