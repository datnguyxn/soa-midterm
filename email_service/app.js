require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const emailRoute = require("./routes/emailRoute");

const connectDb = require("./config/dbConnection");
connectDb();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api/email", emailRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));
