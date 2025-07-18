const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUser
} = require("./../controller/userController");

// Route to get all users
router.get("/", getAllUsers);

// Route to get user by ID
router.get("/:id", verifyToken, getUserById);

// Route to update user profile
router.put("/:id", verifyToken, updateUserProfile);

// Route to change password
router.post("/:id/change-password", verifyToken, changePassword);

// Route to delete user (ADMIN only)
router.delete("/:id", verifyToken, deleteUser);

module.exports = router;
