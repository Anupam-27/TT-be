const express = require("express");
const router = new express.Router();
const userRouter = require("./users.route")
const tournamentRouter = require("./tournaments.route")
const validateRequest = require("../middleware/validateRequest")

router.use("/users/api", [validateRequest.checkJWTAuthentication], userRouter)
router.use("/tournaments/api", [validateRequest.checkJWTAuthentication], tournamentRouter)


module.exports = router;