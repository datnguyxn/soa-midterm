const User = require("../models/user");
const bcrypt = require("bcrypt");

const getLogin = (req, res) => {
  res.render("login");
};

const checkLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const formatedBalance = formatCurrency(user.balance)
      console.log(formatedBalance)
      req.session.user = {
        username: user.username,
        fullname: user.fullname,
        balance: formatedBalance,
        email: user.email, 
        phone: user.phone,
        id: user._id,
      };
      res.redirect("/");
    } else {
      res.render("login", {
        message: { type: "danger", message: "Đăng nhập không thành công" },
      });
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.render("login", {
      message: { type: "danger", message: "Đã xảy ra lỗi" },
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


module.exports = {
  getLogin,
  checkLogin,
};
