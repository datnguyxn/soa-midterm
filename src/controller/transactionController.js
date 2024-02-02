const moment = require("moment");
const nodemailer = require("nodemailer");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const Tuition = require("../models/tuition");

const getTransaction = async (req, res) => {
  const transaction_id = req.params.id;
  const { fullname, balance, email, phone, id } = req.session.user;

  try {
    const transaction = await Transaction.findById(transaction_id);

    if (transaction.isProcessed) {
      return ;
    }
    const user_id = transaction.payer;
    const tuiton_id = transaction.tuition;

    const user = await User.findById(user_id);
    const tuition = await Tuition.findById(tuiton_id);

    const tuitionType = transaction.transfer_content.split("_");
    const amount = await findTuitionAmount(tuition.studentId, tuitionType[2]);

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $inc: { balance: -amount } },
      { new: true }
    );

    var newBalance = formatCurrency(updatedUser.balance) 
    req.session.user = {
      username: user.username,
      fullname: user.fullname,
      balance: newBalance,
      email: user.email, 
      phone: user.phone,
      id: user._id,
    };

    sendEmailConfirmation(
      user.email,
      amount,
      transaction.timestamp,
      transaction_id,
      tuitionType[2]
    );

    const matchingTuition = tuition.tuitions.find(
      (item) => item.type === tuitionType[2]
    );
    if (matchingTuition) {
      matchingTuition.isPaid = true;
      await tuition.save();
    }

    transaction.isProcessed = true;
    await transaction.save();
    
    res.render("transactionResult", {
      transaction,
      transaction_time: moment(transaction.timestamp).format(
        "DD/MM/YYYY HH:mm:ss"
      ),
      user: updatedUser,
      fullname,
      id,
      balance : newBalance,
      amount: formatCurrency(amount),
    });

  } catch (error) {
    console.error("Error getting transaction:", error);
    res.status(500).send("Internal Server Error");
  }
};

const sendEmailConfirmation = (
  recipientEmail,
  amount,
  time,
  id,
  tuitionType
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nguyenquangloi2666@gmail.com",
      pass: "kvjhpvoygkjvifum",
    },
  });
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
        <p><strong>Số Tiền:</strong> ${formatCurrency(amount)}</p>
        <p><strong>Học phí:</strong> ${tuitionType}</p>
        <p><strong>Ngày và Giờ:</strong> ${moment(time).format(
          "DD/MM/YYYY HH:mm:ss"
        )}</p>
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
    }
  });
};

const findTuitionAmount = async (studentId, tuitionType) => {
  try {
    const tuition = await Tuition.findOne({ studentId });
    if (!tuition) {
      return null;
    }
    const matchingTuition = tuition.tuitions.find(
      (item) => item.type === tuitionType
    );

    if (!matchingTuition) {
      return null;
    }
    return matchingTuition.amount;
  } catch (error) {
    console.error("Error finding tuition amount:", error);
    throw error;
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
  const { fullname, balance, email, phone } = req.session.user;
  const id = req.params.id;
  let { page, pageSize, search } = req.query;
  page = page ? parseInt(page, 10) : 1;
  pageSize = pageSize ? parseInt(pageSize, 10) : 7;

  const query = { payer: id, isProcessed: true };
  console.log(query);
  if (search) {
    query.transfer_content = { $regex: new RegExp(search, "i") };
  }

  const transactions = await Transaction.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec();

  const totalTransactions = await Transaction.countDocuments(query);
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const pagination = {
    pages: Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      isCurrent: i + 1 === page,
      id,
    })),
    id,
    pageSize,
    currentPage: page,
    totalTransactions,
  };
  if (page > 1) {
    pagination.prevPage = page - 1;
  }

  if (page < totalPages) {
    pagination.nextPage = page + 1;
  }

  const plainTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const tuitionType = transaction.transfer_content.split("_");
      const tuition_id = transaction.tuition;
      const tuititon = await Tuition.findById(tuition_id);

      const amount = await findTuitionAmount(
        tuititon.studentId,
        tuitionType[2]
      );
      return {
        ...transaction.toJSON(),
        created: moment(transaction.timestamp).format("DD/MM/YYYY HH:mm:ss"),
        amount: formatCurrency(amount),
      };
    })
  );

  if (req.get('User-Agent').includes('Postman') || !req.accepts('html')) {
    return res.status(200).json({
      fullname,
      balance,
      totalPages,
      transactions: plainTransactions,
      search,
      pagination,
    });
  }

  res.render("transactionHistory", {
    fullname,
    balance,
    id,
    totalPages,
    transactions: plainTransactions,
    search,
    pagination,
  });
};
module.exports = { getTransaction, getTransactionHistory, findTuitionAmount};
