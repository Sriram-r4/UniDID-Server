const express = require("express");
const router = express.Router();
const { createUser,signInUser, resendOTP, forgotPassword,verifyOTP, getUser, getUserActivities, logUserActivity, modifyUser } = require("../controllers/userController");

router.post("/signup", createUser);
router.post("/signin", signInUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.get("/:userUnididId",getUser)
router.get("/activities/:userUnididId",getUserActivities)
router.post("/activities/:userUnididId/add",logUserActivity)
router.put("/:userUnididId/newsletter", modifyUser);


module.exports = router;
