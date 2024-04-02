const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token == null) return res.sendStatus(401); // Không có token
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token không hợp lệ
    req.user = user; // Lưu thông tin người dùng từ token vào đối tượng yêu cầu
    next(); // Tiếp tục xử lý yêu cầu
  });
};

module.exports = authenticateToken;