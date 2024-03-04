const User = require("../models/user");
const bcrypt = require("bcrypt");
const checkLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const formatedBalance = formatCurrency(user.balance);
      userInfo = {
        username: user.username,
        fullname: user.fullname,
        balance: formatedBalance,
        email: user.email,
        phone: user.phone,
        id: user._id,
      };

      res.send({
        success: true,
        message: "Login successful",
        user: userInfo,
      });
    } else {
      // Instead of rendering, send a failure message
      res.send({
        success: false,
        message: "Đăng nhập không thành công",
      });
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    // Instead of rendering, send an error message
    res.status(500).send({
      success: false,
      message: "Đã xảy ra lỗi",
    });
  }
};

const formatCurrency = (amount) => {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return formattedAmount;
};

const registerUser = async (req, res) => {
  const { username, email, password, fullname, phone } = req.body;

  try {
    // Check if the email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).exec();

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(401).send({
          success: false,
          message: "Đã đăng ký tài khoản không thành công",
        });
      } else if (existingUser.username === username) {
        return res.status(402).send({
          success: false,
          message: "Username has already been taken",
        });
      }
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      fullname,
    });

    await newUser.save();
    return res.send({
      success: true,
      message: "Đã đăng ký tài khoản thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  checkLogin,
  registerUser,
};
