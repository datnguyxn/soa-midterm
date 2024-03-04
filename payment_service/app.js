require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const paymentRoute = require("./routes/paymentRoute");

const connectDb = require("./config/dbConnection");
connectDb();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());
app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );
const port = process.env.PORT || 3000;

app.use("/api/payment", paymentRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));
