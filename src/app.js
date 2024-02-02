require("dotenv").config();
const express = require("express");
const configViewEngine = require("./config/viewEngine");

// Require router
const loginRoute = require("./routes/loginRoute");
const paymentRoute = require("./routes/paymentRoute");
const registerRoute = require("./routes/registerRoute");
const confirmOTPRoute = require("./routes/otpConfirmationRoute");
const transactionRoute = require("./routes/transactionRoute");
const logoutRoute = require("./routes/logoutRoute");
const isAuthenticated = require("./middleware/authMiddleware");

const connectDb = require("./config/dbConnection");
connectDb();

const app = express();
const port = process.env.PORT || 3000; // port

// config template engine
configViewEngine(app);

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/", isAuthenticated, paymentRoute);
app.use("/confirm", isAuthenticated, confirmOTPRoute);
app.use("/transaction", isAuthenticated, transactionRoute);
app.use("/logout", isAuthenticated, logoutRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));
