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
  isProcessed: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", Transaction);
