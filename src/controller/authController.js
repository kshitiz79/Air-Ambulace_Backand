// authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Sequelize } = require('sequelize');
const User = require("./../model/User");
const dotenv = require("dotenv");

dotenv.config();

// Allowed roles
const ALLOWED_ROLES = ["BENEFICIARY", "CMO", "SDM", "DM", "ADMIN", "SERVICE_PROVIDER"];

// Helper function to generate JWT token
const generateToken = (user_id, role) => {
  return jwt.sign({ user_id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Validate role
const validateRole = (role) => {
  const normalizedRole = role.toUpperCase();
  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    throw new Error("Invalid role");
  }
  return normalizedRole;
};

// Signup Route
const signup = async (req, res) => {
  const { username, password, full_name, email, role, district_id } = req.body;

  try {
    // Validate role
    const normalizedRole = validateRole(role);

    // Check for existing username/email
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or Email already exists",
        success: false
      });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with district_id
    const newUser = await User.create({
      username,
      password_hash,
      full_name,
      email,
      role: normalizedRole, // Store normalized role
      district_id
    });

    return res.status(201).json({
      message: "User created successfully",
      success: true,
      user: newUser
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message || "Error creating user",
      success: false,
      error
    });
  }
};

// Login Route
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false
      });
    }

    const token = generateToken(user.user_id, user.role);

    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      role: user.role, // Already normalized in DB
      district_id: user.district_id,
      userId: user.user_id
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error logging in",
      success: false,
      error
    });
  }
};

// Create User (Admin only)
const createUser = async (req, res) => {
  const { username, password, full_name, email, role } = req.body;
  const adminRole = 'ADMIN';

  if (req.user.role !== adminRole) {
    return res.status(403).json({
      message: "Only Admin can create users",
      success: false
    });
  }

  try {
    // Validate role
    const normalizedRole = validateRole(role);

    const existingUser = await User.findOne({
      where: { [Sequelize.Op.or]: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or Email already exists",
        success: false
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password_hash,
      full_name,
      email,
      role: normalizedRole
    });

    return res.status(201).json({
      message: "User created successfully",
      success: true,
      user: newUser
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Error creating user",
      success: false,
      error
    });
  }
};

module.exports = { signup, login, createUser };