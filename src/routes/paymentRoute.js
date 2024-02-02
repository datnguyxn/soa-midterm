const express = require('express');
const router = express.Router();

const {getPayment, getTuitionInfo} = require('../controller/paymentController');

router.get('/', getPayment);
router.get('/getTuitionInfo/:studentId', getTuitionInfo)

module.exports = router;