const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/documents');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Accept files under specific field names matching ENUM
const upload = multer({ storage }).fields([
  { name: 'AYUSHMAN_CARD', maxCount: 10 },
  { name: 'ID_PROOF', maxCount: 10 },
  { name: 'MEDICAL_REPORT', maxCount: 10 },
  { name: 'EMERGENCY_PROOF', maxCount: 10 },
  { name: 'OTHER', maxCount: 10 },
]);

module.exports = upload;