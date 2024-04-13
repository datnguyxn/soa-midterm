const nodemailer = require("nodemailer");
const crypto = require("crypto");
const axios = require("axios");
let otpStorage = {};

const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});

const getUserInfoFromAuthService = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:3030/api/getUserInfo/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user info from authentication service:",
      error
    );
    throw error;
  }
};

const sendOTP = async (req, res) => {
  const id = req.body.id;
  const tuitionId = req.body.tuitionId;
  const transfer_content = req.body.transfer_content;
  const id_content = tuitionId + "_" + transfer_content.split("_")[2] + "_" + id;
  console.log(id);
  console.log(tuitionId);
  console.log(transfer_content);

  try {
    const userInfo = await getUserInfoFromAuthService(id);
    const email = userInfo.email;
    const storedOTP = otpStorage[id_content];
    if (storedOTP && Date.now() - storedOTP.timestamp <= 60000) {
      return res
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
          .json({ success: true, message: "OTP sent successfully", otp, time: Date.now() - storedOTP.timestamp});
      }
    });

    otpStorage[id_content] = {
      otp,
      timestamp: Date.now(),
      expiration: Date.now() + 60000,
    };
    console.log(otpStorage[id_content]);
  } catch (error) {
    return res.status(500).send(error);
  }
};

const resendOTP = async (req, res) => {
  const id = req.body.id;
  const tuitionId = req.body.tuitionId;
  const transfer_content = req.body.transfer_content;
  const id_content = tuitionId + "_" + transfer_content.split("_")[2] + "_" + id;
  try {
    const userInfo = await getUserInfoFromAuthService(id);
    const email = userInfo.email;

    const storedOTP = otpStorage[id_content];
    if (storedOTP && Date.now() < storedOTP.expiration) {
      res.json({
        success: false,
        message: "Cannot resend OTP. Valid OTP is still active.",
      });
    } else {
      await sendOTP(req, res);
      res.json({
        success: true,
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

const getOtpStorage = (req, res) => {
  res.json(otpStorage);
};

const sendEmailConfirmation = async (req, res) => {
  const {recipientEmail, amount, time, id, tuitionType} = req.body;
  const mailOptions = {
    from: "nguyenquangloi2666@gmail.com",
    to: recipientEmail,
    subject: "Giao Dịch Thành Công",
    html: `
      <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h2 style="color: #007bff;">Xác Nhận Giao Dịch Thành Công</h2>
        <p>Kính gửi Quý khách hàng,</p>
        <p>Cảm ơn bạn đã sử dụng iBanking TDTU. Giao dịch của bạn đã được xác nhận thành công.</p>
        <p>Chi Tiết Giao Dịch:</p>
        <p><strong>Mã Giao Dịch:</strong> ${id}</p>
        <p><strong>Số Tiền:</strong> ${amount}</p>
        <p><strong>Học phí:</strong> ${tuitionType}</p>
        <p><strong>Ngày và Giờ:</strong> ${time}</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        <p>Chú ý: Đây là email tự động, vui lòng không trả lời.</p>
        <hr style="border: 1px solid #ccc; margin: 20px 0;">
        <p style="color: #868e96;">iBanking TDTU - Hệ thống thanh toán trực tuyến của Đại học Tôn Đức Thắng.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
      res
          .status(200)
          .json({ success: true, message: "Sent successfully"});
    }
  });
}

const updateStorage = (req, res) => {
  const { id_content } = req.body;

  delete otpStorage[id_content];
  console.log(otpStorage)

  res.json({ success: true, message: "OTP storage updated successfully" });
}

module.exports = {
  sendOTP,
  resendOTP,
  getOtpStorage,
  sendEmailConfirmation,
  updateStorage
};
