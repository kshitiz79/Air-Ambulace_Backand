const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../model/User');

dotenv.config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('verifyToken - Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('verifyToken - Missing or invalid Authorization header');
    return res.status(403).json({ success: false, message: 'Token is required or invalid format' });
  }

  const token = authHeader.split(' ')[1];
  console.log('verifyToken - Extracted token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('verifyToken - No token extracted');
    return res.status(403).json({ success: false, message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verifyToken - Decoded token:', decoded);

    // Additional proactive verification: Block if User is disabled
    if (decoded.user_id) {
      const currentUser = await User.findByPk(decoded.user_id);
      if (!currentUser || currentUser.status !== 'active') {
        console.log('verifyToken - Blocked Access: User Account Disabled or Missing');
        return res.status(403).json({ success: false, message: 'Your account has been disabled. Please contact the administrator.' });
      }
    }

    req.user = decoded; // Should include user_id, role, etc.
    next();
  } catch (err) {
    console.error('verifyToken - JWT verification error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;