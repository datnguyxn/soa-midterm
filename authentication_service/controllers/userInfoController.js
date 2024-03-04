const User = require("../models/user");

const getUserInfo = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return relevant user information
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
    };
    res.status(200).json(userInfo);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { balance } = req.body;

    // Use findByIdAndUpdate to find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { balance: balance } },
      { new: true } // to get the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User information updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
};
