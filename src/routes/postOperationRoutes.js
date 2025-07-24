const express = require('express');
const router = express.Router();
const {
  getAllPostOperationReports,
  getPostOperationReportById,
  createPostOperationReport,
  updatePostOperationReport,
  deletePostOperationReport,
  getReportsByEnquiryId,
  getReportStats,
  getReportsByStatus
} = require('../controller/postOperationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllPostOperationReports);
router.get('/stats', getReportStats);
router.get('/status/:status', getReportsByStatus);
router.get('/enquiry/:enquiryId', getReportsByEnquiryId);
router.get('/:id', getPostOperationReportById);
router.post('/', createPostOperationReport);
router.put('/:id', updatePostOperationReport);
router.delete('/:id', deletePostOperationReport);

module.exports = router;