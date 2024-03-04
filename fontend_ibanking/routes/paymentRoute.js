const express = require("express");
const router = express.Router();

const {
  getPayment,
  getInfoTransfer,
  getTuitionInfo,
  getOtpPage,
  sendOtp,
  resendOtp,
  verifyOtp,
  getTransactionPage,
  getTransactionHistory
} = require("../controllers/paymentController");

const isAuthenticated = require("../middleware/authMiddleware");

router.get("/", isAuthenticated, getPayment);
router.get("/getTuitionInfo/:studentId", getTuitionInfo);
router.post("/getInfoTransfer", getInfoTransfer);
router.get("/payment/otp-page", isAuthenticated, getOtpPage);
router.post("/payment/send-otp", isAuthenticated, sendOtp);
router.post("/payment/resend-otp", isAuthenticated, resendOtp);
router.post("/payment/verify-otp", isAuthenticated, verifyOtp);
router.get("/transaction", isAuthenticated, getTransactionPage);
router.get("/transaction-history", isAuthenticated, getTransactionHistory);

module.exports = router;
