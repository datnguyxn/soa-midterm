require("dotenv").config();
const express = require("express");
const configViewEngine = require("./config/viewEngine");

const app = express();
const port = process.env.PORT || 3000;

configViewEngine(app);

const authRoute = require("./routes/authRoute");
const paymentRoute = require("./routes/paymentRoute");


app.use("/", authRoute);
app.use("/", paymentRoute);
app.listen(port, () => console.log(`http://localhost:${port}`));
