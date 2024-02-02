const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi hủy session:", err);
      return res.redirect("/");
    }
    res.redirect("/login");
  });
};

module.exports = {
    logout,
  };
