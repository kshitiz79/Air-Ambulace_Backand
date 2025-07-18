const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ctl = require('../controller/enquiryController');

// Apply authentication middleware to all routes
router.use(ctl.extractUserFromToken);

// CMO-specific route for dashboard stats
router.get('/cmo/dashboard-stats', ctl.getCMODashboardStats);

// Regular routes (now with user filtering for CMO)
router.get('/search', ctl.searchEnquiries);
router.get('/', ctl.getAllEnquiries);
router.get('/:id', ctl.getEnquiryById);
router.post('/', upload, ctl.createEnquiry);
router.delete('/:id', ctl.deleteEnquiry);
router.patch('/:id/verify', ctl.verifyEnquiry);
router.patch('/:id/forward', ctl.forwardEnquiryToDM); // New route
router.patch('/:id/approve-reject', ctl.approveOrRejectEnquiry);
router.post('/:id/escalate', ctl.escalateEnquiry); // New escalate route
router.patch('/:id', upload, ctl.updateEnquiry);

module.exports = router;