const FlightAssignment = require('../model/FlightAssignment');
const Enquiry = require('../model/Enquiry');

// Get all flight assignments
const getAllFlightAssignments = async (req, res) => {
  try {
    const assignments = await FlightAssignment.findAll({
      include: [{
        model: Enquiry,
        as: 'enquiry'
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get flight assignment by ID
const getFlightAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await FlightAssignment.findByPk(id, {
      include: [{
        model: Enquiry,
        as: 'enquiry'
      }]
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Flight assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new flight assignment
const createFlightAssignment = async (req, res) => {
  try {
    const assignment = await FlightAssignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update flight assignment
const updateFlightAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await FlightAssignment.update(req.body, {
      where: { assignment_id: id }
    });
    
    if (updated) {
      const updatedAssignment = await FlightAssignment.findByPk(id);
      res.json(updatedAssignment);
    } else {
      res.status(404).json({ error: 'Flight assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete flight assignment
const deleteFlightAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FlightAssignment.destroy({
      where: { assignment_id: id }
    });
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Flight assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignments by status
const getAssignmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const assignments = await FlightAssignment.findAll({
      where: { status },
      include: [{
        model: Enquiry,
        as: 'enquiry'
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignment statistics
const getAssignmentStats = async (req, res) => {
  try {
    const totalAssignments = await FlightAssignment.count();
    const assignedCount = await FlightAssignment.count({ where: { status: 'ASSIGNED' } });
    const inProgressCount = await FlightAssignment.count({ where: { status: 'IN_PROGRESS' } });
    const completedCount = await FlightAssignment.count({ where: { status: 'COMPLETED' } });

    res.json({
      total: totalAssignments,
      assigned: assignedCount,
      inProgress: inProgressCount,
      completed: completedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update assignment status
const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [updated] = await FlightAssignment.update(
      { status, updated_at: new Date() },
      { where: { assignment_id: id } }
    );
    
    if (updated) {
      const updatedAssignment = await FlightAssignment.findByPk(id, {
        include: [{
          model: Enquiry,
          as: 'enquiry'
        }]
      });
      res.json(updatedAssignment);
    } else {
      res.status(404).json({ error: 'Flight assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllFlightAssignments,
  getFlightAssignmentById,
  createFlightAssignment,
  updateFlightAssignment,
  deleteFlightAssignment,
  getAssignmentsByStatus,
  getAssignmentStats,
  updateAssignmentStatus
};