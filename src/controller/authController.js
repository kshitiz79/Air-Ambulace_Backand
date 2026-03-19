// authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Sequelize } = require('sequelize');
const User = require("./../model/User");
const dotenv = require("dotenv");
const { sendMail } = require('../config/email');
const path = require('path');

const otpStore = new Map(); // Store OTPs in memory

dotenv.config();

// Allowed roles
const ALLOWED_ROLES = ["BENEFICIARY", "CMHO", "SDM", "COLLECTOR", "ADMIN", "SERVICE_PROVIDER", "HOSPITAL", "SUPPORT", "DME"];

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
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    // Find user by email instead of username
    const user = await User.findOne({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    if (user.status && user.status !== 'active') {
      console.log(`User login blocked: Status is ${user.status}`);
      return res.status(403).json({
        message: "Your account has been disabled. Please contact the administrator.",
        success: false
      });
    }

    console.log('Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false
      });
    }

    console.log('Generating token for user:', user.user_id, 'role:', user.role);
    const token = generateToken(user.user_id, user.role);

    console.log('Login successful, sending response');
    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      role: user.role, // Already normalized in DB
      district_id: user.district_id,
      userId: user.user_id,
      full_name: user.full_name,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      message: "Error logging in",
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    const emailBody = `Dear User,

We received a request to reset the password associated with your Air Ambulance Portal account. Please use the One-Time Password (OTP) below to proceed:

OTP: ${otp}

This OTP is valid for 10 minutes from the time this email was sent. Please do not share this code with anyone.

If you did not request a password reset, please disregard this email. Your account will remain secure and no changes will be made.

For any assistance, feel free to contact our support team.

Team Air ambulance
PM Shree Air Ambulance Seva`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <p>Dear User,</p>
        <p>We received a request to reset the password associated with your <strong>Air Ambulance Portal</strong> account. Please use the One-Time Password (OTP) below to proceed:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #2563eb; margin: 0; letter-spacing: 5px;">${otp}</h2>
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong> from the time this email was sent. Please do not share this code with anyone.</p>
        <p>If you did not request a password reset, please disregard this email. Your account will remain secure and no changes will be made.</p>
        <p>For any assistance, feel free to contact our support team.</p>
        <p style="margin-top: 30px;">
          Best Regards,<br>
          <strong>Team Air ambulance</strong><br>
          PM Shree Air Ambulance Seva
        </p>
        <div style="margin-top: 20px;">
          <img src="cid:signatureBar" alt="Email Signature Bar" style="width: 100%; height: auto; border-radius: 4px;" />
        </div>
      </div>
    `;

    const signaturePath = "/Users/kshitizmaurya/Documents/Projects/AIr Ambulance/Web-Air-Ambulace/public/Email-Signature-Bar.jpg";

    const emailSent = await sendMail(
      email,
      'Password Reset OTP - Air Ambulance Portal',
      emailBody,
      emailHtml,
      [{
        filename: 'Email-Signature-Bar.jpg',
        path: signaturePath,
        cid: 'signatureBar'
      }]
    );

    if (emailSent) {
      return res.status(200).json({ success: true, message: 'OTP sent successfully to your email' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

  const storedData = otpStore.get(email);
  if (!storedData) return res.status(400).json({ success: false, message: 'No OTP generated or OTP expired' });

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  if (storedData.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

  return res.status(200).json({ success: true, message: 'OTP verified successfully' });
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields are required' });

  const storedData = otpStore.get(email);
  if (!storedData || Date.now() > storedData.expiresAt || storedData.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    user.password_hash = password_hash;
    await user.save();

    otpStore.delete(email);
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, createUser, forgotPassword, verifyOtp, resetPassword };