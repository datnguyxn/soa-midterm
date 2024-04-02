const express = require('express');
const router = express.Router();

const {checkLogin, registerUser} = require('../controllers/authController');


router.post('/api/auth/login', checkLogin);
router.post('/api/auth/register', registerUser);

module.exports = router;