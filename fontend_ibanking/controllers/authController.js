const axios = require("axios");

const getLogin = (req, res) => {
  res.render("login");
};

const getRegister = (req, res) => {
  res.render("register");
};

const activeSessions = {};

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
      const { user, token } = apiResponse.data;

      if (activeSessions[user.id]) {
        return res.redirect("/logout");
      }

      activeSessions[user.id] = token;
      req.session.user = user;

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

async function logoutUser(userId) {
  delete activeSessions[userId];
}

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

const logout = async (req, res) => {
  try {
    if (req.session && req.session.user) {
      const userId = req.session.user.id;
      await logoutUser(userId);
    }
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    res.redirect("/");
  }
};

module.exports = {
  getLogin,
  checkLogin,
  getRegister,
  registerUser,
  logout,
};
