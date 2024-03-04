const express = require('express');
const router = express.Router();

const {sendOTP, resendOTP, getOtpStorage, sendEmailConfirmation, updateStorage} = require("../controllers/emailController");

router.post("/send-otp", sendOTP)
router.post("/resend-otp", resendOTP)
router.get("/otpStorage", getOtpStorage)
router.post("/send-email-confirm", sendEmailConfirmation)
router.post("/update-storage", updateStorage)
module.exports = router;