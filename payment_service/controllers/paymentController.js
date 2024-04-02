const Tuition = require("../models/tuition");
const Student = require("../models/student");

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

    let tuitionInfoDetails = unpaidTuitions.map(({ type, amount }) => ({
      type,
      amount,
    }));

    if (tuitionInfoDetails.length === 0) {
      res.status(200).json({
        fullname: student.fullname,
        tuition_id: tuition._id,
        msg: "Không có khoảng học phí nào cần thanh toán",
      });
    } else {
      res.status(200).json({
        fullname: student.fullname,
        tuition_id: tuition._id,
        tuitionInfoDetails,
      });
    }
  } catch (error) {
    console.error("Error fetching tuition information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getInfoTransaction = async (req, res) => {
  const transfer_content = req.body.transfer_content;
  const tuition_id = req.body.tuition_id;
  res.json({ transfer_content, tuition_id });
};

const updateTuitionStatus = async (tuiton_id, transfer_content) => {
  try {
    const tuition = await Tuition.findById(tuiton_id);
    const tuitionType = transfer_content.split("_");
    const matchingTuition = tuition.tuitions.find(
      (item) => item.type === tuitionType[2]
    );

    if (matchingTuition) {
      matchingTuition.isPaid = true;
      await tuition.save();
      return { success: true, message: "Tuition status updated successfully" };
    } else {
      return { success: false, message: "Matching tuition not found" };
    }
  } catch (error) {
    console.error("Error updating tuition status:", error);
    return { success: false, message: "Internal server error" };
  }
};

const getTuitionStatus = async (tuition_id, transfer_content) => {
  try {
    const tuition = await Tuition.findById(tuition_id);
    const tuitionType = transfer_content.split("_");
    const matchingTuition = tuition.tuitions.find(
      (item) => item.type === tuitionType[2]
    );

    if (matchingTuition) {
      return matchingTuition.isPaid ? "paid" : "unpaid";
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting tuition status:", error);
    return null;
  }
}

const findTuitionAmount = async (req, res) => {
  try {
    const tuition_id = req.body.tuition_id;
    const tuitionType = req.body.tuitionType;

    const tuititon1 = await Tuition.findById(tuition_id);

    const tuition = await Tuition.findOne({ studentId: tuititon1.studentId });
    console.log(tuition)
    if (!tuition) {
      return null;
    }
    const matchingTuition = tuition.tuitions.find(
      (item) => item.type === tuitionType
    );

    if (!matchingTuition) {
      return null;
    }
    res.json(matchingTuition.amount);
  } catch (error) {
    console.error("Error finding tuition amount:", error);
    throw error;
  }
};

module.exports = {
  getTuitionInfo,
  getInfoTransaction,
  updateTuitionStatus,
  findTuitionAmount,getTuitionStatus
};
