const express = require("express");
const { signup, login, createUser, forgotPassword, verifyOtp, resetPassword } = require("./../controller/authController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Signup and Login routes
router.post("/signup", signup);
router.post("/login", login);

// Admin Create User route
router.post("/create-user", verifyToken, createUser);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
