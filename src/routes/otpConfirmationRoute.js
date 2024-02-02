const express = require('express');
const router = express.Router();

const {getOTPPage, sendOTP, verifyOTP, resendOTP, getInfo} = require("../controller/otpConfirmationController")

router.get('/:id', getOTPPage);
router.post('/getInfo/:id', getInfo);
router.post('/send-otp/:id', sendOTP);
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp/:id', resendOTP)

module.exports = router;
