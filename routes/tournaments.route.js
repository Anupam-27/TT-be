const express = require("express");
const router = new express.Router();
const tournamentController = require("../controllers/tournament.controller.js")
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // limit file size to 5MB
    },
});

router.get("/getTournaments", tournamentController.getTournaments)
router.post("/createTournaments", upload.single('photo'), tournamentController.createTournaments)
router.get("/getTournament/:id", tournamentController.getDetails)
router.post("/updateTournaments/:id", upload.single('photo'), tournamentController.updateTournaments)
router.delete("/deleteTournaments/:id", tournamentController.deleteTournaments)
router.post("/createDraws/:id", tournamentController.createDraws)
router.get("/getMatches/:id", tournamentController.getMatches)
router.get("/fetchMatch/:id", tournamentController.fetchMatch)
router.get("/getSetDetails/:id", tournamentController.getSetDetails)

module.exports = router;
