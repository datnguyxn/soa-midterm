const express = require("express");
const router = express.Router();

const { getTuitionInfo, getInfoTransaction, findTuitionAmount} = require("../controllers/paymentController");
const { verifyOTP } = require("../controllers/otpConfirmationController");

router.get("/tuition/:studentId", getTuitionInfo);
router.post("/verify-otp", verifyOTP);
router.post("/transaction-info", getInfoTransaction);
router.post("/find-amount-tuition", findTuitionAmount);


module.exports = router;
