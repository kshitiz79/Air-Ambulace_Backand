const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getAllUsers } = require("../controller/userController");

// Route to get all users
router.get("/",  getAllUsers);

module.exports = router;
