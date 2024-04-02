const Transaction = require("../models/transaction");
const axios = require("axios");
const moment = require("moment");
const createTransaction = async (req, res) => {
  try {
    // Parse parameters from the request body
    const { payer, tuition, transfer_content } = req.body;

    // Create a new Transaction instance
    const transaction = new Transaction({
      payer: payer,
      tuition: tuition,
      transfer_content: transfer_content,
    });

    // Save the transaction to the database
    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: transaction,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

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

const updateUserInfoApi = async (userId, balance) => {
  try {
    const apiUrl = `http://localhost:3030/api/updateUserInfo/${userId}`;

    // Make a POST request to the updateUserInfo API endpoint
    const response = await axios.post(apiUrl, balance);

    // Handle the response from the API
    console.log(response.data);
    return response.data;
  } catch (error) {
    // Handle errors
    console.error(error.message);
    throw error;
  }
};

const balanceControl = async (req, res) => {
  try {
    const { payer, transactionAmount } = req.body;

    const user = await getUserInfoFromAuthService(payer);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.balance -= transactionAmount;

    // Save the updated balance
    const updateUser = await updateUserInfoApi(user.id, {
      balance: user.balance,
    });

    res.status(200).json({
      success: true,
      message: "Balance deducted successfully",
      updatedBalance: updateUser.user,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to deduct balance",
      error: error.message,
    });
  }
};

const fetchTuitionAmount = async (tuition_id, tuitionType) => {
  try {
    const response = await axios.post(
      'http://localhost:3031/api/payment/find-amount-tuition',
      {
          tuition_id: tuition_id,
          tuitionType: tuitionType,
      }
    );

    // Handle the response data
    console.log(response.data);
    return response.data; // Return the data to be used as needed

  } catch (error) {
    // Handle errors
    console.error('Error fetching tuition amount:', error);
    throw error; // Rethrow the error for handling in the calling code
  }
}

const getTransactionHistory = async (req, res) => {
  const id = req.body.id;
  const balance = req.body.balance
  const fullname = req.body.fullname
  let { page, pageSize, search } = req.query;
  page = page ? parseInt(page, 10) : 1;
  pageSize = pageSize ? parseInt(pageSize, 10) : 7;

  const query = { payer: id };
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
      const amount = await fetchTuitionAmount(tuition_id, tuitionType[2])
      return {
        ...transaction.toJSON(),
        created: moment(transaction.timestamp).format("DD/MM/YYYY HH:mm:ss"),
        amount: formatCurrency(amount),
      };
    })
  );
  return res.status(200).json({
    fullname,
    balance,
    totalPages,
    transactions: plainTransactions,
    search,
    pagination,
  });
};

const formatCurrency = (amount) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return formattedAmount;
};

module.exports = {
  createTransaction,
  balanceControl,
  getTransactionHistory,
};
