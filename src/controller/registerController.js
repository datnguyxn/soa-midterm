const User = require("../models/user");
const bcrypt = require("bcrypt");

const getRegister = (req, res) => {
  res.render("register");
};

const registerUser = async (req, res) => {
  // get user input
  const { username, email, password, fullname, phone } = req.body;

  try {
    // Check if the email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).exec();

    if (existingUser) {
      if (existingUser.email === email) {
        req.session.message = {
            type: "danger",
            message: "Đã đăng ký tài khoản không thành công",
          };
        return res.redirect("/register");
      } else if (existingUser.username === username) {
        return res.status(400).send("Username has already been taken");
      }
    }
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      fullname
    });

    await newUser.save();
    req.session.message = {
      type: "success",
      message: "Đã đăng ký tài khoản thành công",
    };
    return res.redirect("/login");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

module.exports = { getRegister, registerUser };
