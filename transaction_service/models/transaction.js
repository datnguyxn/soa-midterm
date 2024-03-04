const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Transaction = new Schema({
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tuition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tuition",
  },
  transfer_content: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", Transaction);
