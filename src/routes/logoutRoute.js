const express = require("express");
const router = express.Router();

const { logout } = require("../controller/logoutController");
router.get("/", logout);
module.exports = router;
