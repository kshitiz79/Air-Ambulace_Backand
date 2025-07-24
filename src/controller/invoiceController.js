const Invoice = require('../model/Invoice');
const Enquiry = require('../model/Enquiry');

// Get all invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        }
      ]
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      invoice_date: req.body.invoice_date || new Date().toISOString().split('T')[0]
    };

    const invoice = await Invoice.create(invoiceData);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Invoice.update(req.body, {
      where: { invoice_id: id }
    });
    
    if (updated) {
      const updatedInvoice = await Invoice.findByPk(id);
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [updated] = await Invoice.update(
      { status },
      { where: { invoice_id: id } }
    );
    
    if (updated) {
      const updatedInvoice = await Invoice.findByPk(id);
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice statistics
const getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices = await Invoice.count();
    const pendingInvoices = await Invoice.count({ where: { status: 'PENDING' } });
    const paidInvoices = await Invoice.count({ where: { status: 'PAID' } });
    
    const totalRevenue = await Invoice.sum('amount', { where: { status: 'PAID' } }) || 0;
    const pendingRevenue = await Invoice.sum('amount', { where: { status: 'PENDING' } }) || 0;

    res.json({
      total: totalInvoices,
      pending: pendingInvoices,
      paid: paidInvoices,
      totalRevenue: parseFloat(totalRevenue),
      pendingRevenue: parseFloat(pendingRevenue)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoices by status
const getInvoicesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const invoices = await Invoice.findAll({
      where: { status },
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
  getInvoicesByStatus
};