const axios = require("axios");

let otpStorage = {};

const { updateTuitionStatus } = require("./paymentController");

const getOtpStorageFromEmailService = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3032/api/email/otpStorage"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching otpStorage from emailService:", error);
    throw error;
  }
};

const checkOTP = async (email, userOTP) => {
  otpStorage = await getOtpStorageFromEmailService();
  console.log(otpStorage);
  const storedOTP = otpStorage[email];
  console.log(storedOTP);
  if (!storedOTP) {
    return false;
  }
  const isValid =
    storedOTP.otp === userOTP && Date.now() - storedOTP.timestamp <= 60000;
  if (isValid) {
    console.log(otpStorage);
    try {
      await axios.post("http://localhost:3032/api/email/update-storage", {
        email,
      });
      console.log("OTP storage updated successfully");
    } catch (error) {
      console.error("Error updating otpStorage in emailService:", error);
      throw error;
    }
  }
  console.log("1 ", storedOTP.otp);
  console.log("2 ", userOTP);

  return isValid;
};

const createTransaction = async (payer, tuition, transfer_content) => {
  try {
    const apiUrl = "http://localhost:3034/api/transaction/create-transaction";

    const response = await axios.post(apiUrl, {
      payer: payer,
      tuition: tuition,
      transfer_content: transfer_content,
    });
    console.log(response.data);
    return response.data.transaction;
  } catch (error) {
    // Handle errors
    console.error(error.message);
    throw error;
  }
};

const balanceControl = async (payerId, transactionAmount) => {
  try {
    const apiUrl = "http://localhost:3034/api/transaction/balance-control";

    const response = await axios.post(apiUrl, {
      payer: payerId,
      transactionAmount: transactionAmount,
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    // Handle errors
    console.error(error.message);
    throw error;
  }
};

const MAX_INVALID_ATTEMPTS = 3;

const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const userOTP = req.body.otp;
    const id = req.body.id;
    const tuitionId = req.body.tuitionId;
    const transferContent = req.body.transferContent;
    const amount = req.body.amount;
    let invalidAttempts = req.session.invalidAttempts || 0;
    const isValidOTP = await checkOTP(email, userOTP);
    console.log(isValidOTP);
    if (isValidOTP) {
      const transaction = await createTransaction(
        id,
        tuitionId,
        transferContent
      );
      await updateTuitionStatus(tuitionId, transferContent);
      const updatedBalance = await balanceControl(id, amount);

      res.status(200).json({
        success: true,
        message: "Xác thực thành công",
        transaction,
        updatedBalance,
      });
    } else {
      invalidAttempts++;
      console.log(invalidAttempts);
      req.session.invalidAttempts = invalidAttempts;

      if (invalidAttempts >= MAX_INVALID_ATTEMPTS) {
        res.status(203).json({
          success: false,
          message: "Số lần nhập sai quá nhiều, đăng xuất tài khoản",
        });
      } else {
        res.status(201).json({
          success: false,
          message: "Mã OTP không hợp lệ",
          remainingAttempts: MAX_INVALID_ATTEMPTS - invalidAttempts,
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  verifyOTP,
};
