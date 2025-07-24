const PostOperationReport = require('../model/PostOperationReport');
const Enquiry = require('../model/Enquiry');
const User = require('../model/User');

// Get all post-operation reports
const getAllPostOperationReports = async (req, res) => {
  try {
    const reports = await PostOperationReport.findAll({
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'submittedBy'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get post-operation report by ID
const getPostOperationReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await PostOperationReport.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'submittedBy'
        }
      ]
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Post-operation report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new post-operation report
const createPostOperationReport = async (req, res) => {
  try {
    const report = await PostOperationReport.create(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update post-operation report
const updatePostOperationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PostOperationReport.update(req.body, {
      where: { report_id: id }
    });
    
    if (updated) {
      const updatedReport = await PostOperationReport.findByPk(id);
      res.json(updatedReport);
    } else {
      res.status(404).json({ error: 'Post-operation report not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete post-operation report
const deletePostOperationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PostOperationReport.destroy({
      where: { report_id: id }
    });
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Post-operation report not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reports by enquiry ID
const getReportsByEnquiryId = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const reports = await PostOperationReport.findAll({
      where: { enquiry_id: enquiryId },
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'submittedBy'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get report statistics
const getReportStats = async (req, res) => {
  try {
    const totalReports = await PostOperationReport.count();
    const successfulTransfers = await PostOperationReport.count({ 
      where: { patient_transfer_status: 'SUCCESSFUL' } 
    });
    const failedTransfers = await PostOperationReport.count({ 
      where: { patient_transfer_status: 'FAILED' } 
    });

    res.json({
      total: totalReports,
      successful: successfulTransfers,
      failed: failedTransfers,
      successRate: totalReports > 0 ? Math.round((successfulTransfers / totalReports) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reports by transfer status
const getReportsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const reports = await PostOperationReport.findAll({
      where: { patient_transfer_status: status },
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'submittedBy'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPostOperationReports,
  getPostOperationReportById,
  createPostOperationReport,
  updatePostOperationReport,
  deletePostOperationReport,
  getReportsByEnquiryId,
  getReportStats,
  getReportsByStatus
};