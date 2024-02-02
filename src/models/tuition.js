const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Tuition = new Schema({
  studentId: {
    type: String,
    ref: "Student",
  },
  tuitions: [
    {
      type: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("Tuition", Tuition);
