const express = require('express');
const router = express.Router();
const caseQueryController = require('./../controller/caseQueryController');
const authMiddleware = require('./../middleware/authMiddleware');

// Debug logs


router.post('/', authMiddleware, caseQueryController.createCaseQuery);
router.patch('/:query_id/respond', authMiddleware, caseQueryController.respondToCaseQuery);
router.get('/', authMiddleware, caseQueryController.getAllCaseQueries);
router.get('/:query_id', authMiddleware, caseQueryController.getCaseQueryById);

module.exports = router;