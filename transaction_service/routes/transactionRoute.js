const express = require('express');
const router = express.Router();

const {createTransaction, balanceControl, getTransactionHistory} = require("../controllers/transactionController")


router.post('/create-transaction', createTransaction)
router.post('/balance-control', balanceControl)
router.post('/transaction-history', getTransactionHistory)

module.exports = router