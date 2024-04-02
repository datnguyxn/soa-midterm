const axios = require("axios");
let otpStorage = {};

const {
  updateTuitionStatus,
  getTuitionStatus,
} = require("./paymentController");

const getOtpStorageFromEmailService = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3032/api/email/otpStorage"
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching otpStorage from emailService:", error);
    throw error;
  }
};

const checkOTP = async (id_content, userOTP) => {
  otpStorage = await getOtpStorageFromEmailService();
  console.log(otpStorage);
  const storedOTP = otpStorage[id_content];
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
        id_content: id_content,
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

// Định nghĩa một hàng đợi để lưu trữ các yêu cầu thanh toán
const paymentQueue = [];

// Hàm xử lý yêu cầu thanh toán
const processPaymentRequest = async () => {
  while (paymentQueue.length > 0) {
    const paymentRequest = paymentQueue.shift();
    // Kiểm tra trạng thái của học phí
    const tuitionStatus = await getTuitionStatus(paymentRequest.tuitionId, paymentRequest.transferContent);
    console.log(tuitionStatus);
    if (tuitionStatus === "paid") {
      console.log("Học phí đã được thanh toán đủ.");
      paymentRequest.response.json({
        success: false,
        message: "Học phí đã được thanh toán đủ.",
      });
    } else {
      // Thực hiện giao dịch và cập nhật dữ liệu
      const transaction = await createTransaction(
        paymentRequest.id,
        paymentRequest.tuitionId,
        paymentRequest.transferContent
      );
      await updateTuitionStatus(
        paymentRequest.tuitionId,
        paymentRequest.transferContent
      );
      const updatedBalance = await balanceControl(
        paymentRequest.id,
        paymentRequest.amount
      );

      paymentRequest.response.status(200).json({
        success: true,
        message: "Xác thực thành công",
        transaction,
        updatedBalance,
      });
    }
  }
};

// Middleware xử lý yêu cầu thanh toán
const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const userOTP = req.body.otp;
    const id = req.body.id;
    const tuitionId = req.body.tuitionId;
    const transferContent = req.body.transferContent;
    const id_content = tuitionId + "_" + transferContent.split("_")[2];
    console.log(id_content);
    const amount = req.body.amount;
    let invalidAttempts = req.session.invalidAttempts || 0;
    const isValidOTP = await checkOTP(id_content, userOTP);

    if (isValidOTP) {
      // Thêm yêu cầu thanh toán vào hàng đợi
      paymentQueue.push({
        id,
        tuitionId,
        transferContent,
        amount,
        response: res,
      });
      console.log(paymentQueue);
      // Xử lý yêu cầu thanh toán
      processPaymentRequest();
    } else {
      invalidAttempts++;
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
