const express = require('express');
const router = express.Router();
const {
  getAllFlightAssignments,
  getFlightAssignmentById,
  createFlightAssignment,
  updateFlightAssignment,
  deleteFlightAssignment,
  getAssignmentsByStatus,
  getAssignmentStats,
  updateAssignmentStatus,
  getAssignmentByEnquiryId,
  completeAssignment,
} = require('../controller/flightAssignmentController');
const authMiddleware      = require('../middleware/authMiddleware');
const flightDocsUpload    = require('../middleware/flightDocsUpload');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllFlightAssignments);
router.get('/stats', getAssignmentStats);
router.get('/status/:status', getAssignmentsByStatus);
router.get('/enquiry/:enquiryId', getAssignmentByEnquiryId);
router.get('/:id', getFlightAssignmentById);
router.post('/', createFlightAssignment);
router.put('/:id', updateFlightAssignment);
router.patch('/:id/status', updateAssignmentStatus);
router.patch('/:id/complete', flightDocsUpload, completeAssignment);
router.delete('/:id', deleteFlightAssignment);

module.exports = router;