const moment = require("moment");
const axios = require("axios");
let tuition_id;
let transfer_content = "";
let amount;
const getPayment = (req, res) => {
  if(!req.session.user) return res.redirect("/login");
  const { fullname, email, phone, id, balance } = req.session.user;
  res.render("home_payment", { fullname, email, phone, id, balance });
};

const getTransactionPage = (req, res) => {
  if(!req.session.user) return res.redirect("/login");
  const { transaction, transaction_time, user, fullname, id, balance, amount } =
    req.session.transaction;
  res.render("transaction_result", {
    transaction,
    transaction_time,
    user,
    fullname,
    id,
    balance,
    amount,
  });
};

const getTuitionInfo = async (req, res) => {
  const studentId = req.params.studentId;
  const apiResponse = await axios.get(
    `http://localhost:3031/api/payment/tuition/${studentId}`
  );
  const responseData = apiResponse.data;
  res.json(responseData);
};

const getInfoTransfer = async (req, res) => {
  tuition_id = req.body.tuition_id;
  transfer_content = req.body.transfer_content;
  amount = req.body.amount;
  console.log(tuition_id, transfer_content, amount);
  res.json({ tuition_id, transfer_content, amount });
};

const getOtpPage = async (req, res) => {
  if(!req.session.user) return res.redirect("/login");
  const { fullname, balance, email, phone, id } = req.session.user;
  res.render("otp_confirmation", { fullname, email, phone, id, balance });
};

const sendOtp = async (req, res) => {
    try {
        tuition_id = req.body.tuition_id;
        transfer_content = req.body.transfer_content;
      
        const apiResponse = await axios.post(
            "http://localhost:3032/api/email/send-otp",
            {
                id: req.session.user.id,
                tuitionId: tuition_id,
                transfer_content: transfer_content,
            }
        );
        console.log(apiResponse.data);
        return apiResponse.data;
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const resendOtp = async (req, res) => {
  const apiResponse = await axios.post(
    "http://localhost:3032/api/email/resend-otp",
    {
      id: req.session.user.id,
      tuitionId: tuition_id,
      transfer_content: transfer_content,
    }
  );
  console.log(apiResponse.data);

  return apiResponse.data.succes;
};

const sendEmailConfirm = async (
  recipientEmail,
  amount,
  time,
  id,
  tuitionType
) => {
  try {
    const apiResponse = await axios.post(
      "http://localhost:3032/api/email/send-email-confirm",
      {
        recipientEmail,
        amount,
        time,
        id,
        tuitionType,
      }
    );

    console.log(apiResponse.data);

    return apiResponse.data.success;
  } catch (error) {
    console.error("Error calling email confirmation API:", error);
    return false;
  }
};

let otpVerificationAttempts = 0;
const verifyOtp = async (req, res) => {
  const apiResponse = await axios.post(
    "http://localhost:3031/api/payment/verify-otp",
    {
      email: req.session.user.email,
      otp: req.body.otp,
      id: req.session.user.id,
      tuitionId: tuition_id,
      transferContent: transfer_content,
      amount: amount,
    }
  );

  if (apiResponse.data.success) {
    var newBalance = formatCurrency(
      apiResponse.data.updatedBalance.updatedBalance.balance
    );
    req.session.user = {
      username: req.session.user.username,
      fullname: req.session.user.fullname,
      balance: newBalance,
      email: req.session.user.email,
      phone: req.session.user.phone,
      id: apiResponse.data.updatedBalance.updatedBalance.id,
    };
    transaction = apiResponse.data.transaction;
    const tuitionType = transfer_content.split("_");

    req.session.transaction = {
      transaction,
      transaction_time: moment(transaction.timestamp).format(
        "DD/MM/YYYY HH:mm:ss"
      ),
      user: req.session.user,
      fullname: req.session.user.fullname,
      id: req.session.user.id,
      balance: req.session.user.balance,
      amount: formatCurrency(amount),
    };
    res.json({ success: true });
    await sendEmailConfirm(
      req.session.user.email,
      formatCurrency(amount),
      moment(transaction.timestamp).format("DD/MM/YYYY HH:mm:ss"),
      transaction._id,
      tuitionType[2]
    );
  } else if (apiResponse.status === 201) {
    otpVerificationAttempts++;

    if (otpVerificationAttempts === 3) {
      // Logout the user after three failed attempts
      otpVerificationAttempts = 0;
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        //res.redirect("/login");
      });
      return res.json({
        success: false,
        message: "Mã OTP không hợp lệ. Đã đăng xuất do quá số lần thử.",
        remainingAttempts: 0,
      });
    } else {
      // Provide information about the remaining attempts
      res.json({
        success: false,
        message: "Mã OTP không hợp lệ",
        remainingAttempts: 3 - otpVerificationAttempts,
      });
    }
  } else {
  }
};

const formatCurrency = (amount) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return formattedAmount;
};

const getTransactionHistory = async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:3034/api/transaction/transaction-history",
      {
        id: req.session.user.id,
        balance: req.session.user.balance,
        fullname: req.session.user.fullname,
      },
      {
        params: {
          page: req.query.page,
          pageSize: req.query.pageSize,
          search: req.query.search,
        },
      }
    );
    console.log(response.data);
    res.render("transactionHistory", {
      fullname: response.data.fullname,
      balance: response.data.balance,
      id: req.session.user.id,
      totalPages: response.data.totalPages,
      transactions: response.data.transactions,
      search: response.data.search,
      pagination: response.data.pagination,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
  }
};

module.exports = {
  getPayment,
  getTuitionInfo,
  getOtpPage,
  sendOtp,
  resendOtp,
  verifyOtp,
  getInfoTransfer,
  getTransactionPage,
  getTransactionHistory,
};
