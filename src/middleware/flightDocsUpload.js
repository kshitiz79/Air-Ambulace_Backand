const multer = require('multer');

// Store files in memory so they aren't written to disk
const storage = multer.memoryStorage();

const flightDocsUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
}).fields([
  { name: 'medical_summary', maxCount: 1 },
  { name: 'manifest',        maxCount: 1 },
]);

module.exports = flightDocsUpload;
