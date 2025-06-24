const express = require("express");
const { signup, login, createUser } = require("./../controller/authController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Signup and Login routes
router.post("/signup", signup);
router.post("/login", login);

// Admin Create User route
router.post("/create-user", verifyToken, createUser);

module.exports = router;
