const express = require('express')
const router = express.Router()

const {registerUser, getRegister} = require("../controller/registerController")

router.get('/', getRegister)
router.post('/',registerUser)

module.exports = router
