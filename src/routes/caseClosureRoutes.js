const express = require('express');
const router = express.Router();
const {
  getAllCaseClosures,
  getCaseClosureById,
  createCaseClosure,
  updateCaseClosure,
  getClosuresByStatus,
  getClosureStats
} = require('../controller/caseClosureController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllCaseClosures);
router.get('/stats', getClosureStats);
router.get('/status/:status', getClosuresByStatus);
router.get('/:id', getCaseClosureById);
router.post('/', createCaseClosure);
router.put('/:id', updateCaseClosure);

module.exports = router;