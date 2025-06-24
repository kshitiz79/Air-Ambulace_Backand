const User = require("../model/User");

// Get all users (ADMIN only)
const getAllUsers = async (req, res) => {


  try {
    const users = await User.findAll({
      attributes: { exclude: ["password_hash"] } // do not return password hashes
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      success: true,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      success: false,
      error
    });
  }
};



















module.exports = {
  getAllUsers
};
