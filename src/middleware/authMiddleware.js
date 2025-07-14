const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
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
    req.user = decoded; // Should include user_id, role, etc.
    next();
  } catch (err) {
    console.error('verifyToken - JWT verification error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;