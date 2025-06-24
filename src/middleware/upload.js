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
  { name: 'AYUSHMAN_CARD', maxCount: 1 },
  { name: 'ID_PROOF', maxCount: 1 },
  { name: 'MEDICAL_REPORT', maxCount: 1 },
  { name: 'OTHER', maxCount: 1 },
]);

module.exports = upload;