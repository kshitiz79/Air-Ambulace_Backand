const CaseClosure = require('../model/CaseClosure');
const Enquiry = require('../model/Enquiry');
const User = require('../model/User');

// Get all case closures
const getAllCaseClosures = async (req, res) => {
  try {
    const closures = await CaseClosure.findAll({
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'closedBy'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(closures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get case closure by ID
const getCaseClosureById = async (req, res) => {
  try {
    const { id } = req.params;
    const closure = await CaseClosure.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'closedBy'
        }
      ]
    });
    
    if (!closure) {
      return res.status(404).json({ error: 'Case closure not found' });
    }
    
    res.json(closure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new case closure
const createCaseClosure = async (req, res) => {
  try {
    const closureData = {
      ...req.body,
      closure_date: new Date(),
      closure_status: 'CLOSED'
    };
    
    const closure = await CaseClosure.create(closureData);
    
    // Update enquiry status to closed
    await Enquiry.update(
      { status: 'CLOSED' },
      { where: { enquiry_id: req.body.enquiry_id } }
    );
    
    res.status(201).json(closure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update case closure
const updateCaseClosure = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await CaseClosure.update(req.body, {
      where: { closure_id: id }
    });
    
    if (updated) {
      const updatedClosure = await CaseClosure.findByPk(id);
      res.json(updatedClosure);
    } else {
      res.status(404).json({ error: 'Case closure not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get closures by status
const getClosuresByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const closures = await CaseClosure.findAll({
      where: { closure_status: status },
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: User,
          as: 'closedBy'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(closures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get closure statistics
const getClosureStats = async (req, res) => {
  try {
    const totalClosures = await CaseClosure.count();
    const pendingClosures = await CaseClosure.count({ where: { closure_status: 'PENDING' } });
    const closedCases = await CaseClosure.count({ where: { closure_status: 'CLOSED' } });
    const rejectedClosures = await CaseClosure.count({ where: { closure_status: 'REJECTED' } });

    // Calculate average closure time
    const closedCasesWithTime = await CaseClosure.findAll({
      where: { closure_status: 'CLOSED' },
      include: [{
        model: Enquiry,
        as: 'enquiry'
      }]
    });

    let totalClosureTime = 0;
    let validClosures = 0;

    closedCasesWithTime.forEach(closure => {
      if (closure.enquiry && closure.enquiry.created_at && closure.closure_date) {
        const timeDiff = new Date(closure.closure_date) - new Date(closure.enquiry.created_at);
        totalClosureTime += timeDiff;
        validClosures++;
      }
    });

    const avgClosureTime = validClosures > 0 ? Math.round(totalClosureTime / validClosures / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      total: totalClosures,
      pending: pendingClosures,
      closed: closedCases,
      rejected: rejectedClosures,
      avgClosureTimeDays: avgClosureTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCaseClosures,
  getCaseClosureById,
  createCaseClosure,
  updateCaseClosure,
  getClosuresByStatus,
  getClosureStats
};