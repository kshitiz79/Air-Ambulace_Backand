const multer = require('multer');

// Store files in memory so they aren't written to disk
const storage = multer.memoryStorage();

// Accept files under specific field names matching ENUM
const upload = multer({ storage }).fields([
  { name: 'AYUSHMAN_CARD',   maxCount: 10 },
  { name: 'ID_PROOF',        maxCount: 10 },
  { name: 'MEDICAL_REPORT',  maxCount: 10 },
  { name: 'EMERGENCY_PROOF', maxCount: 10 },
  { name: 'OTHER',           maxCount: 10 },
]);

module.exports = upload;