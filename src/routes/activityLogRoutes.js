const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getLogs, getLogStats, getSecurityEvents, getDbStats } = require('../controller/activityLogController');

// All routes require authentication (IT_TEAM / ADMIN / SUPPORT)
router.get('/', verifyToken, getLogs);
router.get('/stats', verifyToken, getLogStats);
router.get('/security', verifyToken, getSecurityEvents);
router.get('/db-stats', verifyToken, getDbStats);

module.exports = router;
