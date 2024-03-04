const express = require('express');
const router = express.Router();


const {getUserInfo, updateUserInfo} = require('../controllers/userInfoController');

router.get('/api/getUserInfo/:userId', getUserInfo)
router.post('/api/updateUserInfo/:userId', updateUserInfo)

module.exports = router;