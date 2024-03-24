require('dotenv').config()
const validation = require("../validations")
const validateRequest = require("../middleware/validateRequest")
const model = require("../model")
const Email = model.email
const Users = model.users
const phoneNumber = model.phone_numbers
const TourPermission = model.tournament_permission
const Tournaments = model.tournaments
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const service = process.env.TWILIO_SERVICE_SID
const client = require('twilio')(accountSid, authToken);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const redis = require('../utils/redis')
const nodemailer = require('nodemailer');
const { default: axios } = require('axios')
const S3 = require("../utils/s3")
const { generateImageVariants } = require('../utils/imageGenerator')
const { Op } = require('sequelize')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASS
    }
});

// let s3bucket = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// });
// const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: image.originalname,
//     Body: file,
//     ContentType: image.mimetype,
//     ACL: 'public-read'
// };

const genToken = (user, key = process.env.JWT_SECRET_KEY, expiry = '1d') => {
    let token = jwt.sign(
        { user: user },
        key,
        { expiresIn: expiry }
    );
    return {
        token: "Bearer " + token,
        user: user,
    };
};

const getNewOTP = () => {
    const otp = Math.random().toString().substr(2, 6);
    return otp;
};



exports.send_otp = async (req, res) => {
    try {
        const { errors, isValid, error } = validation.checkMobile(req.body)

        if (!isValid) {
            return validateRequest.returnResponse(
                req,
                res,
                422,
                error,
                "send_otp",
                errors
            )
        }
        const new_otp = getNewOTP()
        const phone_number = req.body.phone_number
        await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${req.body.phone_number}`,
            body: `Your tt app otp is ${new_otp}`,
        });

        const enOtp = bcrypt.hashSync(new_otp, 5)
        // //console.log(phone_number, enOtp, "enotp")
        await redis.setToken(phone_number, enOtp, 30)
        return validateRequest.returnResponse(
            req,
            res,
            202,
            'Otp sent successfully!',
            "send_otp"
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            422,
            err.message,
            "send_otp"
        )
    }
}

exports.verfiy_otp = async (req, res) => {
    try {
        const { errors, isValid, error } = validation.checkMobileAndOtp(req.body)

        if (!isValid) {
            return validateRequest.returnResponse(
                req,
                res,
                422,
                error,
                "verify_otp",
                errors
            )
        }
        const phone_number = req.body.phone_number
        const OTP = await redis.getToken(phone_number)
        //console.log(OTP, req.body.otp)
        if (!OTP) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "OTP expired. resend again",
                "verify_otp"
            )
        }
        const otpValid = bcrypt.compareSync(req.body.otp, OTP)

        if (otpValid) {
            await redis.deleteToken(phone_number)
            return validateRequest.returnResponse(
                req,
                res,
                202,
                "OTP verified successfully",
                "verify_otp"
            )
        } else {
            return validateRequest.returnResponse(
                req,
                res,
                422,
                "Invalid otp",
                "verify_otp"
            )
        }
    } catch (err) {
        //console.log(err)
        return validateRequest.returnResponse(
            req,
            res,
            422,
            err.message,
            "verify_otp"
        )
    }
}

exports.login = async (req, res) => {
    try {
        const userEmail = await Email.findOne({
            where: {
                email: req.body.email
            }
        })
        if (!userEmail) {
            return validateRequest.returnResponse(
                req,
                res,
                402,
                "Email not found!",
                "login"
            )
        }
        await Users.findOne({
            where: {
                id: userEmail.user_id
            }
        }).then(async (user) => {
            if (user) {
                const isValid = bcrypt.compareSync(req.body.password, user.password)
                if (isValid) {
                    const payload = {
                        id: user.id,
                    }

                    const tokenObj = genToken(payload)

                    await redis.setToken(tokenObj.token.split(" ")[1], 60 * 60 * 24)
                    // //console.log(resd)
                    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 hour in milliseconds
                    res.cookie("access_token", tokenObj.token, {
                        domain: "http://localhost:3000",
                        httpOnly: false,
                        secure: process.env.NODE_ENV === "production",
                        expire: expirationTime
                    })

                    return validateRequest.returnResponse(
                        req,
                        res,
                        200,
                        "LoggedIn successfully",
                        "login",
                        { token: tokenObj.token }
                    )
                } else {
                    return validateRequest.returnResponse(
                        req,
                        res,
                        400,
                        "Password is invalid",
                        "login"
                    );
                }
            } else {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "You are not registered. Please signup first",
                    "login"
                );
            }
        })
    } catch (err) {
        console.log(err)
        return validateRequest.returnResponse(
            req,
            res,
            500,
            err.message,
            "login"
        )
    }
}

exports.signup = async (req, res) => {
    try {

        const userEmail = await Email.findOne({
            where: {
                email: req.body.email
            }
        })
        if (userEmail) {
            return validateRequest.returnResponse(
                req,
                res,
                402,
                "Email already exists",
                "signup"
            )
        }

        Users.create({
            fullname: req.body.name,
            photo: null,
            age: req.body.age,
            gender: req.body.gender,
            password: bcrypt.hashSync(req.body.password, 10),
            provider_name: "email"
        }).then(async (user) => {
            await Email.create({
                email: req.body.email,
                user_id: user.id
            })
            const userObj = {
                id: user.id,
            };
            const tokenObj = genToken(userObj, process.env.LINK_VERIFICATION)
            const link = `${process.env.FE_URL}/verify_link?checkID=${user.id}&string=${tokenObj.token.split(" ")[1]}`
            const mailOptions = {
                from: process.env.MAILER_EMAIL,
                to: req.body.email,
                subject: 'Email verification!',
                text: `Click on the link to verify your email ${link}`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    //console.log(error);
                } else {
                    //console.log('Email sent: ' + info.response, info);
                }
            });
            //console.log(user.id, String(user.id), "user_id")
            //saving token to redis
            const data = await redis.setToken(String(user.id), tokenObj.token.split(" ")[1], 420)
            //console.log(data, "tokan data")
            // res.cookie("access_token", tokenObj.token, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === "production",
            // })

            return validateRequest.returnResponse(
                req,
                res,
                200,
                "Verification link has been sent successfully",
                "signup",
            )
            // { ...tokenObj }
        })
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            err.message,
            "signup"
        )
    }
}
exports.get_token = async (req, res) => {
    try {
        const token = await redis.getToken(req.query.token.split(" ")[1])
        return validateRequest.returnResponse(
            req,
            res,
            200,
            "Token fetching success",
            "get_token",
            token
        )
    } catch (err) {
        //console.log(err)
    }
}

exports.verify_link = async (req, res) => {
    try {
        const { checkID, string } = req.query
        let tokenValid
        try {
            tokenValid = jwt.verify(string, process.env.LINK_VERIFICATION)
        } catch (err) {
            //console.log(err)
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Link expired",
                "verify_link",
            )
        }
        const userExists = await Users.findOne({
            where: {
                id: checkID
            }
        })
        if (!tokenValid || !userExists) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Invalid link",
                "verify_link",
            )
        }
        const token = await redis.getToken(checkID)
        //console.log(token, "token")
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        })
        //console.log(res, "verify res")
        return validateRequest.returnResponse(
            req,
            res,
            200,
            `Email verified successfully`,
            "verify_link",
            { token: token }
        )

    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "verify_link",
        )
    }
}

exports.google_login = async (req, res) => {
    try {
        const token = req.query.google_token
        //console.log(token, "google test")

        const user_profile = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`)

        const { email, email_verified, name, sub } = user_profile.data
        if (email_verified) {
            const userEmail = await Email.findOne({
                where: {
                    email: email
                }
            })
            if (userEmail) {
                const payload = {
                    id: userEmail.user_id,
                }

                const tokenObj = genToken(payload)

                await redis.setToken(tokenObj.token.split(" ")[1])

                const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in milliseconds
                res.cookie("access_token", tokenObj.token, {
                    domain: "http://localhost:3000",
                    httpOnly: false,
                    secure: process.env.NODE_ENV === "production",
                    expire: expirationTime
                })

                return validateRequest.returnResponse(
                    req,
                    res,
                    200,
                    "LoggedIn successfully",
                    "google_login",
                    { token: tokenObj.token }
                )
            } else {
                Users.create({
                    fullname: name,
                    password: bcrypt.hashSync(sub, 10),
                    provider_name: "google_login",
                    age: "22 Years"
                }).then(async (user) => {
                    await Email.create({
                        email: email,
                        user_id: user.id
                    })
                    const userObj = {
                        id: user.id,
                    };
                    const tokenObj = genToken(userObj, process.env.LINK_VERIFICATION)
                    const link = `${process.env.FE_URL}/verify_link?checkID=${user.id}&string=${tokenObj.token.split(" ")[1]}`
                    const mailOptions = {
                        from: process.env.MAILER_EMAIL,
                        to: email,
                        subject: 'Email verification!',
                        text: `Click on the link to verify your email ${link}`
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            //console.log(error);
                        } else {
                            //console.log('Email sent: ' + info.response, info);
                        }
                    });
                    // //console.log(user.id, String(user.id), "user_id")
                    //saving token to redis
                    const data = await redis.setToken(String(user.id), tokenObj.token.split(" ")[1], 420)
                    // //console.log(data, "tokan data")
                    // res.cookie("access_token", tokenObj.token, {
                    //     httpOnly: true,
                    //     secure: process.env.NODE_ENV === "production",
                    // })

                    return validateRequest.returnResponse(
                        req,
                        res,
                        202,
                        "Verification link has been sent successfully",
                        "google_login",
                    )
                    // { token: tokenObj.token }
                    // { ...tokenObj }
                })
            }
        } else {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "Not able to login!",
                "google_login"
            )
        }
        // //console.log(user_profile.data, "check")
        // return validateRequest.returnResponse(
        //     req,
        //     res,
        //     200,
        //     "Successfully loggedIn",
        //     "google_login",
        //     user_profile.data
        // )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "google_login",
        )
    }
}

exports.uploadImage = async (req, res) => {
    try {
        const image_key = `${req.user.id}_${Date.now()}`

        const images = await generateImageVariants(image_key, req.file)
        console.log(images)
        const deleteObj = images.map(async (variant) => {
            return await S3.deleteObject({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `profile/${variant.name}`
            }, function (err, data) { }).promise()
        })
        console.log(await Promise.all(deleteObj), "obj")
        deleteObj.map(async (variant) => {
            console.log(await variant)
        })

        const uploadPromises = images.map(async (variant) => {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `profile/${variant.name}`, // Adjust the path and file name
                Body: variant.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read'
            };

            return S3.upload(params).promise();
        });

        const result = await Promise.all(uploadPromises);
        console.log(result)
        const imageData = []
        result.map((_val) => {
            imageData.push({ [_val.Key]: _val.Location })
        })

        if (result) {
            const check = await Users.update(
                { photo: image_key },
                {
                    where: {
                        id: req.user.id
                    }
                }
            )
            //console.log(check)
        }
        return validateRequest.returnResponse(
            req,
            res,
            200,
            "uploaded",
            "upload_photo",
            result[0].Location
        )
    } catch (err) {
        //console.log(err)
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "upload_photo",
        )
    }
}

exports.get_profile = async (req, res) => {
    try {
        const userId = req.user.id;
        // //console.log(req.user, "checking")
        let userDetails = await Users.findOne({
            where: {
                id: userId
            },
            attributes: {
                exclude: ['provider_name', 'password', 'created_at', 'updated_at', 'deleted_at'],
            },
            include: [
                {
                    model: Email,
                    attributes: ["email"],
                    required: true,
                },
                {
                    model: phoneNumber,
                    attributes: ["phone_number"],
                }
            ]
        })

        if (!userDetails) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "No user found",
                "profile",
            )
        }

        userDetails = userDetails.get({ plain: true })
        // const data = { ...userDetails }

        return validateRequest.returnResponse(
            req,
            res,
            200,
            "User profile",
            "profile",
            userDetails
        )
    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "profile",
        )
    }
}

exports.update_profile = async (req, res) => {
    try {
        const userId = req.user.id;

        const userDetails = await Users.findOne({
            where: {
                id: userId
            },
            attributes: ["id"],
            plain: true
        })

        if (!userDetails) {
            return validateRequest.returnResponse(
                req,
                res,
                400,
                "No user found",
                "update_profile",
            )
        }
        console.log(req.body.email)

        if (req.body.email) {
            const checkEmail = await Email.findOne({
                where: {
                    email: req.body.email
                }
            })
            if (checkEmail) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "Email already exists!",
                    "update_profile",
                )
            }
            const userEmail = await Email.findAndCountAll({
                where: {
                    user_id: userId
                },
                plain: true
            })
            console.log(userEmail)

            if (!userEmail.count) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "No user found",
                    "update_profile",
                )
            }
            //console.log(userEmail.length, userEmail)
            if (userEmail.count >= 4) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "You cannot add more than 4 email's in this account",
                    "update_profile",
                )
            }

            // await Email.create({
            //     email: req.body.email,
            //     user_id: userId
            // })
            return validateRequest.returnResponse(
                req,
                res,
                202,
                "Email added successfully.",
                "update_profile",
            )
        } else {
            const checkPhone = await phoneNumber.findOne({
                where: {
                    phone_number: req.body.phone_number
                }
            })
            if (checkPhone) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "Phone number already exists!",
                    "update_profile",
                )
            }
            const userPhone = await phoneNumber.findAndCountAll({
                where: {
                    user_id: userId
                }
            })

            if (userPhone.count >= 4) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "You cannot add more than 4 phone number in this account",
                    "update_profile",
                )
            }
            await phoneNumber.create({
                phone_number: req.body.phone_number,
                user_id: userId
            })
            return validateRequest.returnResponse(
                req,
                res,
                202,
                "Phone number added successfully.",
                "update_profile",
            )
        }

    } catch (err) {
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "update_profile",
        )
    }
}

exports.get_users_list = async (req, res) => {
    try {
        const userType = req.query.type || null
        // console.log(req.query, "query")
        let start_date = req.query.date || null
        // start_date = new Date(start_date);
        // console.log(start_date.toISOString())
        if (userType === 'player') {
            // const today = new Date();
            // today.setHours(0, 0, 0, 0);

            // filter upcoming tours
            let allTours = await Tournaments.findAll({
                attributes: ["id", "start_date"],
                include: [
                    {
                        model: TourPermission,
                        attributes: ["user_id"], // Exclude columns from Table1 in the result
                        // where: {
                        //     tour_id: {
                        //         [Op.eq]: Tournaments.id
                        //     }, // Join condition
                        // },
                        right: true,
                        // separate: true,
                    },
                ],
                where: {
                    start_date: {
                        [Op.eq]: start_date
                    }
                },
                raw: true,
                subQuery: false, // Use subQuery: false to flatten the result
            });
            console.log(allTours, "allTours")

            // allTours = allTours.map(tour => {
            //     const { id, start_date, 'tournament_permissions.user_id': user_id } = tour;
            //     console.log(id, start_date, user_id, "hello")
            //     return { id, start_date, user_id };
            // });
            const userIds = allTours.map((_val) => {
                const { 'tournament_permissions.user_id': user_id } = _val
                return user_id
            })
            console.log(userIds, "allTours")
            // let filteredTours = await Tournaments.findAll({
            //     attributes: ['id'],
            //     where: {
            //         start_date: {
            //             [Op.notIn]: start_date
            //         }
            //     },
            //     raw: true
            // })
            // filteredTours = filteredTours.map((_val) => _val.id)
            // console.log(filteredTours, "filteredTours")

            //find all users registered with upcoming tours
            // let freeUserIds = await TourPermission.findAll({
            //     attributes: ['user_id'],
            //     where: {
            //         tour_id: {
            //             [Op.notIn]: filteredTours
            //         }
            //     },
            //     raw: true,
            // })
            // freeUserIds = freeUserIds.map((_val) => _val.user_id)
            // console.log(freeUserIds, "freeUserIds")

            //get all user who are not registered in any upcoming tour
            const freeUsers = await Users.findAll({
                attributes: {
                    exclude: ['provider_name', 'password', 'created_at', 'updated_at', 'deleted_at'],
                },
                where: {
                    id: {
                        [Op.not]: userIds
                    }
                }
            })
            // console.log(freeUsers, "freeUsers")


            return validateRequest.returnResponse(
                req,
                res,
                200,
                "User list.",
                "get_users_list",
                freeUsers
            )
        } else {
            const users = await Users.findAll({
                attributes: {
                    exclude: ['provider_name', 'password', 'created_at', 'updated_at', 'deleted_at'],
                },
            })

            if (users) {
                return validateRequest.returnResponse(
                    req,
                    res,
                    200,
                    "User list.",
                    "get_users_list",
                    users
                )
            }
            else {
                return validateRequest.returnResponse(
                    req,
                    res,
                    400,
                    "No user found!",
                    "get_users_list",
                )
            }
        }
    } catch (err) {
        console.log(err, "tour err")
        return validateRequest.returnResponse(
            req,
            res,
            500,
            `Something went wrong ${err.message}`,
            "get_users_list",
        )
    }
}