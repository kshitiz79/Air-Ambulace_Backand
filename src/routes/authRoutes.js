const express = require("express");
const { signup, login, createUser, bulkCreateUsers, forgotPassword, verifyOtp, resetPassword, changePassword } = require("./../controller/authController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Signup and Login routes
router.post("/signup", signup);
router.post("/login", login);

// Admin Create User route
router.post("/create-user", verifyToken, createUser);
router.post("/create-user-bulk", verifyToken, bulkCreateUsers);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Authenticated password change (first-login forced change)
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
