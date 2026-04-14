const FlightAssignment = require('../model/FlightAssignment');
const Enquiry = require('../model/Enquiry');

/**
 * Returns next calendar day at 12:00:00 IST (UTC+5:30 = 06:30:00 UTC)
 * from a given departure date.
 */
const getNextDayNoonIST = (departureDate) => {
  const d = new Date(departureDate);
  // Move to next day
  d.setUTCDate(d.getUTCDate() + 1);
  // Set to 06:30 UTC = 12:00 IST
  d.setUTCHours(6, 30, 0, 0);
  return d;
};

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
    const Ambulance = require('../model/Ambulance');

    // Validate ambulance is still available before assigning
    if (assignmentData.ambulance_id) {
      const ambulance = await Ambulance.findByPk(assignmentData.ambulance_id);
      if (!ambulance) {
        return res.status(404).json({ error: 'Ambulance not found' });
      }
      if (ambulance.status !== 'AVAILABLE') {
        return res.status(400).json({
          error: `Ambulance ${assignmentData.ambulance_id} is not available (current status: ${ambulance.status})`
        });
      }
    }

    const assignment = await FlightAssignment.create(assignmentData);

    if (crewMembers && Array.isArray(crewMembers)) {
      await assignment.setCrewMembers(crewMembers);
    }

    // Auto: set ambulance status based on departure_time
    if (assignmentData.ambulance_id) {
      const Ambulance = require('../model/Ambulance');

      if (assignmentData.departure_time) {
        // Departure time set → schedule return for next day 12:00 IST (06:30 UTC)
        const returnAt = getNextDayNoonIST(new Date(assignmentData.departure_time));
        await Ambulance.update(
          { status: 'RETURNING', return_available_at: returnAt },
          { where: { ambulance_id: assignmentData.ambulance_id } }
        );
        console.log(`[AUTO] Ambulance ${assignmentData.ambulance_id} → RETURNING, available at ${returnAt.toISOString()}`);
      } else {
        // No departure time yet → just mark IN_USE
        await Ambulance.update(
          { status: 'IN_USE', return_available_at: null },
          { where: { ambulance_id: assignmentData.ambulance_id } }
        );
        console.log(`[AUTO] Ambulance ${assignmentData.ambulance_id} → IN_USE`);
      }
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
    const Ambulance = require('../model/Ambulance');

    const assignment = await FlightAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Flight assignment not found' });
    }

    const prevAmbulanceId  = assignment.ambulance_id;
    const prevStatus       = assignment.status;
    const newStatus        = assignmentData.status || prevStatus;
    const newAmbulanceId   = assignmentData.ambulance_id || prevAmbulanceId;

    // If ambulance is being swapped, validate new one is available
    if (assignmentData.ambulance_id && assignmentData.ambulance_id !== prevAmbulanceId) {
      const newAmb = await Ambulance.findByPk(assignmentData.ambulance_id);
      if (!newAmb) return res.status(404).json({ error: 'New ambulance not found' });
      if (newAmb.status !== 'AVAILABLE') {
        return res.status(400).json({ error: `Ambulance ${assignmentData.ambulance_id} is not available (status: ${newAmb.status})` });
      }
    }

    await FlightAssignment.update(assignmentData, { where: { assignment_id: id } });

    if (crewMembers && Array.isArray(crewMembers)) {
      const updated = await FlightAssignment.findByPk(id);
      await updated.setCrewMembers(crewMembers);
    }

    // ── Auto ambulance status management ──────────────────────────────────
    // Case 1: Ambulance swapped → release old, mark new as IN_USE
    if (assignmentData.ambulance_id && assignmentData.ambulance_id !== prevAmbulanceId) {
      await Ambulance.update({ status: 'AVAILABLE', return_available_at: null }, { where: { ambulance_id: prevAmbulanceId } });
      await Ambulance.update({ status: 'IN_USE', return_available_at: null }, { where: { ambulance_id: newAmbulanceId } });
      console.log(`[AUTO] Ambulance swap: ${prevAmbulanceId} → AVAILABLE, ${newAmbulanceId} → IN_USE`);
    }

    // Case 2: Departure time set/updated → schedule RETURNING for next day 12:00 IST
    const newDeparture = assignmentData.departure_time;
    if (newDeparture && newStatus !== 'COMPLETED') {
      const returnAt = getNextDayNoonIST(new Date(newDeparture));
      await Ambulance.update(
        { status: 'RETURNING', return_available_at: returnAt },
        { where: { ambulance_id: newAmbulanceId } }
      );
      console.log(`[AUTO] Ambulance ${newAmbulanceId} → RETURNING, available at ${returnAt.toISOString()}`);
    }

    // Case 3: Assignment completed → release ambulance immediately
    if (newStatus === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      await Ambulance.update({ status: 'AVAILABLE', return_available_at: null }, { where: { ambulance_id: newAmbulanceId } });
      console.log(`[AUTO] Assignment COMPLETED → Ambulance ${newAmbulanceId} → AVAILABLE`);
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

// Get assignment by enquiry ID
const getAssignmentByEnquiryId = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const assignment = await FlightAssignment.findOne({
      where: { enquiry_id: enquiryId },
      include: [
        { model: require('../model/Ambulance'), as: 'ambulance' },
        { model: require('../model/CrewMember'), as: 'crewMembers', through: { attributes: [] } },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: assignment || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
  updateAssignmentStatus,
  getAssignmentByEnquiryId,
};