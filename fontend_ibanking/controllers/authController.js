const axios = require("axios");

const getLogin = (req, res) => {
  res.render("login");
};

const getRegister = (req, res) => {
  res.render("register");
};

const checkLogin = async (req, res) => {
  try {
    const apiResponse = await axios.post(
      "http://localhost:3030/api/auth/login",
      {
        username: req.body.username,
        password: req.body.password,
      }
    );
    if (apiResponse.data.success) {
      req.session.user = apiResponse.data.user;
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

const registerUser = async (req, res) => {
  try {
    const apiResponse = await axios.post(
      "http://localhost:3030/api/auth/register",
      {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        fullname: req.body.fullname,
        phone: req.body.phone,
      }
    );
    if (apiResponse.data.success) {
      req.session.message = {
        type: "success",
        message: "Đã đăng ký tài khoản thành công",
      };
      return res.redirect("/login");
    } else if (apiResponse.status === 401) {
      req.session.message = {
        type: "danger",
        message: "Đã đăng ký tài khoản không thành công",
      };
      return res.redirect("/register");
    } else {
      req.session.message = {
        type: "danger",
        message: "Username has already been taken",
      };
      return res.redirect("/register");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.redirect("/");
      }
      res.redirect("/login");
    });
  }

module.exports = {
  getLogin,
  checkLogin,
  getRegister,
  registerUser,
  logout
};
