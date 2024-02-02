const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/user");
const Tuition = require("../models/tuition");
const Transaction = require("../models/transaction");

const otpStorage = {};
var tuition_id;
let transfer_content = "";

const getOTPPage = (req, res) => {
  const { fullname, balance, email, phone, id } = req.session.user;
  const storedOTP = otpStorage[email];
  if (storedOTP) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - storedOTP.timestamp;
    const remainingTime = Math.max(0, 60000 - elapsedTime);
    res.render("otpConfirmation", {
      fullname,
      balance,
      email,
      phone,
      id,
      remainingTime,
    });
  } else {
    res.render("otpConfirmation", { fullname, balance, email, phone, id });
  }
};

const getInfo = (req, res) => {
  tuition_id = req.body.tuition_id;
  transfer_content = req.body.transferContent;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nguyenquangloi2666@gmail.com",
    pass: "kvjhpvoygkjvifum",
  },
});

const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

const sendOTP = async (req, res) => {
  const _id = req.params.id;
  const user = await User.findOne({ _id });
  if (!user) {
    return res.status(404).send("User not found");
  }
  const email = user.email;
  const storedOTP = otpStorage[email];

  if (storedOTP && Date.now() - storedOTP.timestamp <= 60000) {
    return res
      .status(400)
      .json({ success: false, message: "Valid OTP is still active" });
  }

  const otp = generateOTP();
  const mailOptions = {
    from: "nguyenquangloi2666@gmail.com",
    to: email,
    subject: "Xác nhận thanh toán trên iBanking TDTU",
    html: `
      <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h2 style="color: #007bff;">iBanking TDTU - Xác nhận thanh toán</h2>
        <p>Cảm ơn bạn đã sử dụng dịch vụ iBanking TDTU. Đây là mã OTP xác nhận giao dịch của bạn:</p>
        <p style="font-size: 24px; font-weight: bold; color: #28a745;">${otp}</p>
        <p>Mã OTP này có hiệu lực trong 1 phút.</p>
        <p>Chú ý: Đây là email tự động, vui lòng không trả lời.</p>
        <hr style="border: 1px solid #ccc; margin: 20px 0;">
        <p style="color: #868e96;">iBanking TDTU - Hệ thống thanh toán trực tuyến của trường Đại học Tôn Đức Thắng.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).send("Error sending OTP");
    } else {
      console.log("OTP sent:", info.response);
      res
        .status(200)
        .json({ success: true, message: "OTP sent successfully", otp });
    }
  });

  otpStorage[email] = {
    otp,
    timestamp: Date.now(),
    expiration: Date.now() + 60000,
  };
  console.log(otpStorage[email]);
};

const resendOTP = async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const email = user.email;
    const storedOTP = otpStorage[email];
    if (storedOTP && Date.now() < storedOTP.expiration) {
      res.json({
        success: false,
        message: "Cannot resend OTP. Valid OTP is still active.",
      });
    } else {
      const remainingTime = storedOTP.expiration - Date.now();
      await sendOTP(req, res);
      res.json({
        success: true,
        remainingTime,
        message: "Resend OTP successfully",
      });
    }
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Hàm xác thực OTP
const funcVerifyOTP = (email, userOTP) => {
  const storedOTP = otpStorage[email];

  if (!storedOTP) {
    return false;
  }
  const isValid =
    storedOTP.otp === userOTP && Date.now() - storedOTP.timestamp <= 60000; // Thời hạn hiệu lực là 1 phút
  if (isValid) {
    delete otpStorage[email];
  }

  return isValid;
};

const MAX_INVALID_ATTEMPTS = 3;

const verifyOTP = async (req, res) => {
  try {
    const { email, id } = req.session.user;
    const userOTP = req.body.otp;

    let invalidAttempts = req.session.invalidAttempts || 0;

    const isValidOTP = funcVerifyOTP(email, userOTP);

    if (isValidOTP) {
      req.session.invalidAttempts = 0;

      const transaction = new Transaction({
        payer: req.session.user.id,
        tuition: tuition_id,
        transfer_content: transfer_content,
      });
      transaction.save();

      res.status(200).json({
        success: true,
        message: "Xác thực thành công",
        transaction_id: transaction._id,
      });
    } else {
      invalidAttempts++;
      req.session.invalidAttempts = invalidAttempts;

      if (invalidAttempts >= MAX_INVALID_ATTEMPTS) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
          }
          res.status(401).json({
            success: false,
            message: "Số lần nhập sai quá nhiều, đăng xuất tài khoản",
          });
        });
      } else {
        req.session.message = {
          type: "danger",
          message: "Mã OTP không hợp lệ",
        };
        res.status(400).json({
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

module.exports = { getOTPPage, verifyOTP, sendOTP, resendOTP, getInfo };
