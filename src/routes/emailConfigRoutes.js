const express = require('express');
const router = express.Router();
const { getConfig, saveConfig } = require('../controller/emailConfigController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getConfig);
router.post('/', verifyToken, saveConfig);

module.exports = router;
