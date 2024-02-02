const Tuition = require("../models/tuition");
const Student = require("../models/student");

const getPayment = (req, res) => {
  const { fullname, email, phone, id, balance } = req.session.user;
  res.render("homePayment", { fullname, email, phone, id, balance });
};

const getTuitionInfo = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const tuition = await Tuition.findOne({ studentId });
    const student = await Student.findOne({ studentId });

    if (!tuition) {
      return res.status(404).json({
        error: "Tuition information not found for the student",
      });
    }

    const unpaidTuitions = tuition.tuitions.filter(
      (tuitionItem) => !tuitionItem.isPaid
    );

    const tuitionInfoDetails = unpaidTuitions.map(({ type, amount }) => ({
      type,
      amount,
    }));

    res.status(200).json({
      fullname: student.fullname,
      tuition_id: tuition._id,
      tuitionInfoDetails,
    });
  } catch (error) {
    console.error("Error fetching tuition information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getPayment,
  getTuitionInfo,
};
