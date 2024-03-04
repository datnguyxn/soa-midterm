require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const transactionRoute = require("./routes/transactionRoute")
const connectDb = require("./config/dbConnection");
connectDb();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api/transaction", transactionRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));