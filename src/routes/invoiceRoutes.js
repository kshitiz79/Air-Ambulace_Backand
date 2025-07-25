const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
  getInvoicesByStatus
} = require('../controller/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all invoices
router.get('/', getAllInvoices);

// Get invoice statistics
router.get('/stats', getInvoiceStats);

// Get invoices by status
router.get('/status/:status', getInvoicesByStatus);

// Get invoice by ID
router.get('/:id', getInvoiceById);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.put('/:id', updateInvoice);

// Update invoice status
router.patch('/:id/status', updateInvoiceStatus);

module.exports = router;