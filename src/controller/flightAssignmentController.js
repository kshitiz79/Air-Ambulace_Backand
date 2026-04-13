const FlightAssignment = require('../model/FlightAssignment');
const Enquiry = require('../model/Enquiry');

// Get all flight assignments
const getAllFlightAssignments = async (req, res) => {
  try {
    const assignments = await FlightAssignment.findAll({
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: require('../model/CrewMember'),
          as: 'crewMembers',
          through: { attributes: [] }
        }
      ],
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
      include: [
        {
          model: Enquiry,
          as: 'enquiry'
        },
        {
          model: require('../model/CrewMember'),
          as: 'crewMembers',
          through: { attributes: [] }
        }
      ]
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
    const { crewMembers, ...assignmentData } = req.body;
    const assignment = await FlightAssignment.create(assignmentData);
    
    if (crewMembers && Array.isArray(crewMembers)) {
      await assignment.setCrewMembers(crewMembers);
    }
    
    const finalAssignment = await FlightAssignment.findByPk(assignment.assignment_id, {
      include: [{ model: require('../model/CrewMember'), as: 'crewMembers' }]
    });
    
    res.status(201).json(finalAssignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update flight assignment
const updateFlightAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { crewMembers, ...assignmentData } = req.body;
    
    const [updated] = await FlightAssignment.update(assignmentData, {
      where: { assignment_id: id }
    });
    
    const assignment = await FlightAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Flight assignment not found' });
    }
    
    if (crewMembers && Array.isArray(crewMembers)) {
      await assignment.setCrewMembers(crewMembers);
    }
    
    const updatedAssignment = await FlightAssignment.findByPk(id, {
      include: [{ model: require('../model/CrewMember'), as: 'crewMembers' }]
    });
    res.json(updatedAssignment);
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