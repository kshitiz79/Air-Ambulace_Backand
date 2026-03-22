const express = require('express');
const router = express.Router();
const ctl = require('../controller/whatsappConfigController');
const jwt = require('jsonwebtoken');

// Inline lightweight token extractor — avoids circular require of enquiryController
const extractUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
};

router.use(extractUser);
router.get('/', ctl.getConfig);
router.post('/', ctl.saveConfig);
router.post('/test', ctl.testMessage);

module.exports = router;
