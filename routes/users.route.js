const express = require("express");
const router = new express.Router();
const userController = require("../controllers/user.controller.js")
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // limit file size to 5MB
    },
});

router.post("/send_otp", userController.send_otp)
router.post("/verify_otp", userController.verfiy_otp)
router.post("/signup", userController.signup)
router.get("/get_token", userController.get_token)
router.post("/login", userController.login)
router.get("/verify_link", userController.verify_link)
router.post("/google_login", userController.google_login)
router.get("/profile", userController.get_profile)
router.put("/update_profile", userController.update_profile)
router.get("/get_users_list", userController.get_users_list)

router.put('/photos', upload.single('image'), userController.uploadImage)

module.exports = router;
