const express = require("express");
const router = express.Router();

const {
  getLogin,
  checkLogin,
  getRegister,
  registerUser,
  logout
} = require("../controllers/authController");

const isAuthenticated = require("../middleware/authMiddleware");

router.get("/login", getLogin);
router.post("/login", checkLogin);
router.get("/register", getRegister);
router.post("/register", registerUser);
router.get("/logout", isAuthenticated, logout)
module.exports = router;
