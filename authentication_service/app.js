require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const authRoute = require("./routes/authRoutes");
const userInfoRoute = require("./routes/userInfoRoute");
const authenticateToken = require("./middleware/authenticateToken")
const connectDb = require("./config/dbConnection");
connectDb();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});
const port = process.env.PORT || 3000;

app.use("/", authRoute);
app.use("/", userInfoRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));
