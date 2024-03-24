const jwt = require("jsonwebtoken");
const model = require("../model");
const redis = require("../utils/redis");
const Users = model.users;
let exportFuns = {}

exportFuns.checkJWTAuthentication = async (req, res, next) => {
    try {
        let api_name = req.url.substr(req.url.lastIndexOf("/") + 1);
        if (!isNaN(parseInt(api_name))) {
            api_name = req.url.split("/");
            api_name = api_name[api_name.length - 2];
        }
        api_name = api_name.split("?")[0];
        const nonLoginApis = ["signup", "login", "send_otp", "verify_otp", "verify_link", "google_login"]

        const authHeader = req.headers.authorization
        const authToken = authHeader ? authHeader.split(" ")[1] : "";
        // //console.log(api_name)
        if (nonLoginApis.indexOf(api_name) == -1 && authToken && authToken != "") {
            try {
                // //console.log(authToken)
                const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
                // //console.log(decodedToken)
                const USER = decodedToken.user;
                const isTokenExistsInCache = await redis.getToken(authToken)
                // //console.log(isTokenExistsInCache)
                if (!USER || !isTokenExistsInCache) {
                    console.log(USER, isTokenExistsInCache)
                    // error
                    const errorMsg = "LOGIN_SESSION_EXPIRED";
                    exportFuns.returnResponse(req, res, 401, errorMsg, api_name);
                } else {
                    const userObj = await exportFuns.checkAutherization(USER.id, api_name);
                    if (userObj) {
                        req["user"] = userObj;
                        next();
                    } else {
                        const errorMsg = "INVALID_AUTH_TOKEN";
                        exportFuns.returnResponse(req, res, 401, errorMsg, api_name);
                    }
                }
            } catch (err) {
                console.log(err)
                // error
                //console.log(err)
                const errorMsg = "LOGIN_SESSION_EXPIRED";
                exportFuns.returnResponse(req, res, 401, errorMsg, api_name);
            }
        } else if (nonLoginApis.includes(api_name)) {
            next()
        } else {
            // error
            const errorMsg = "AUTH_TOKEN_MISSING";
            exportFuns.returnResponse(req, res, 402, errorMsg, api_name);
        }
    } catch (err) {
        // error
        const errorMsg = err.toString();
        exportFuns.returnResponse(req, res, 500, errorMsg, api_name);
    }
};

exportFuns.checkAutherization = (userId, api_name) => {
    return Users.findOne({
        attributes: [
            "id",
            "photo",
            "fullname",
            "age",
            "gender",
        ],
        where: {
            id: userId,
        },
    })
        .then((userObj) => {
            if (userObj.photo == null) {
                if (userObj.gender == "Male") {
                    userObj.photo = `${process.env.PUBLICPATH}/public/images/male.png`;
                } else if (userObj.gender == "Female") {
                    userObj.photo = `${process.env.PUBLICPATH}/public/images/female.png`;
                } else {
                    userObj.photo = `${process.env.PUBLICPATH}/public/images/other.png`;
                }
            }
            // else {
            //     userObj.photo = `${process.env.PUBLICPATH}/uploads/users/${userObj.photo}`;
            // }
            return userObj.get({ plain: true });
        })
        .catch((err) => {
            exportFuns.returnResponse(req, res, 400, err.message, api_name);
        });
}

exportFuns.returnResponse = (
    req,
    res,
    status_code,
    message,
    api_name,
    data = {}
) => {
    if (status_code == 500) {
        let body = req.body;
        delete body.JwtUser;
        data = {
            body: body,
            headers: req.headers,
            params: req.params,
            files: req.files,
        };

        const createPattern = {
            api_name: api_name,
            message: message,
            request_data: data,
        };
    }

    let responseObject = {};
    let success = false;
    if (status_code == 422) {
        responseObject = {
            success: success,
            status: status_code,
            api_name: api_name,
            message: message,
            errors: data,
        };
    } else {
        if (status_code == 200 || status_code == 202) {
            success = true;
        }
        responseObject = {
            success: success,
            status: status_code,
            api_name: api_name,
            message: message,
            data: data,
        };
    }
    //console.log(status_code, "status_code")
    res.status(status_code).json(responseObject);
    return;
};


module.exports = exportFuns;
