const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ctl = require('../controller/enquiryController');

router.get('/', ctl.getAllEnquiries);
router.get('/:id', ctl.getEnquiryById);
router.post('/', upload, ctl.createEnquiry);
router.delete('/:id', ctl.deleteEnquiry);
router.patch('/:id/verify', ctl.verifyEnquiry);
router.patch('/:id/forward', ctl.forwardEnquiryToDM); // New route
router.patch('/:id/approve-reject', ctl.approveOrRejectEnquiry);
router.patch('/:id', upload, ctl.updateEnquiry);
module.exports = router;