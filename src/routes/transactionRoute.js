const express = require('express');
const router = express.Router();

const {getTransaction, getTransactionHistory} = require("../controller/transactionController");

router.get('/:id', getTransaction)

router.get('/history/:id', getTransactionHistory)
router.post('/history/:id', getTransactionHistory)


module.exports = router