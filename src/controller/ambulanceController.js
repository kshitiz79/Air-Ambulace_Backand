const { Ambulance, FlightAssignment, Enquiry } = require('../model');
const { Op } = require('sequelize');

// Get all ambulances
const getAllAmbulances = async (req, res) => {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (location) whereClause.base_location = { [Op.like]: `%${location}%` };

    const ambulances = await Ambulance.findAndCountAll({
      where: whereClause,
      include: [{
        model: FlightAssignment,
        as: 'assignments',
        where: { status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] } },
        required: false,
        include: [{
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name']
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ambulance_id', 'ASC']]
    });

    res.json({
      success: true,
      data: ambulances.rows,
      pagination: {
        total: ambulances.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(ambulances.count / limit)
      }
    });
  } catch (error) {
    console.error('Get ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulances',
      error: error.message
    });
  }
};

// Get available ambulances for assignment
const getAvailableAmbulances = async (req, res) => {
  try {
    const { location } = req.query;

    const whereClause = {
      status: 'AVAILABLE'
    };

    if (location) {
      whereClause.base_location = { [Op.like]: `%${location}%` };
    }

    const availableAmbulances = await Ambulance.findAll({
      where: whereClause,
      attributes: [
        'ambulance_id',
        'aircraft_type',
        'registration_number',
        'base_location'
      ],
      order: [['base_location', 'ASC'], ['ambulance_id', 'ASC']]
    });

    res.json({
      success: true,
      data: availableAmbulances,
      message: `Found ${availableAmbulances.length} available ambulances`
    });
  } catch (error) {
    console.error('Get available ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available ambulances',
      error: error.message
    });
  }
};

// Get ambulance by ID
const getAmbulanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const ambulance = await Ambulance.findByPk(id, {
      include: [{
        model: FlightAssignment,
        as: 'assignments',
        include: [{
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status']
        }],
        order: [['created_at', 'DESC']],
        limit: 10
      }]
    });

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.json({
      success: true,
      data: ambulance
    });
  } catch (error) {
    console.error('Get ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulance',
      error: error.message
    });
  }
};

// Create new ambulance
const createAmbulance = async (req, res) => {
  try {
    const ambulanceData = req.body;

    // Validate required fields
    const requiredFields = ['ambulance_id', 'aircraft_type', 'registration_number', 'base_location'];
    for (const field of requiredFields) {
      if (!ambulanceData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const ambulance = await Ambulance.create(ambulanceData);

    res.status(201).json({
      success: true,
      data: ambulance,
      message: 'Ambulance created successfully'
    });
  } catch (error) {
    console.error('Create ambulance error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ambulance ID or registration number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create ambulance',
      error: error.message
    });
  }
};

// Update ambulance
const updateAmbulance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const ambulance = await Ambulance.findByPk(id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    await ambulance.update(updateData);

    res.json({
      success: true,
      data: ambulance,
      message: 'Ambulance updated successfully'
    });
  } catch (error) {
    console.error('Update ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance',
      error: error.message
    });
  }
};

// Update ambulance status
const updateAmbulanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const ambulance = await Ambulance.findByPk(id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    // Check if ambulance has active assignments when trying to set to maintenance
    if (status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE') {
      const activeAssignments = await FlightAssignment.count({
        where: {
          ambulance_id: id,
          status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] }
        }
      });

      if (activeAssignments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status to ${status}. Ambulance has ${activeAssignments} active assignment(s).`
        });
      }
    }

    await ambulance.update({ status });

    res.json({
      success: true,
      data: ambulance,
      message: `Ambulance status updated to ${status}`
    });
  } catch (error) {
    console.error('Update ambulance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance status',
      error: error.message
    });
  }
};

// Get ambulance statistics
const getAmbulanceStats = async (req, res) => {
  try {
    const stats = await Ambulance.findAll({
      attributes: [
        'status',
        [Ambulance.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const totalAmbulances = await Ambulance.count();
    const activeAssignments = await FlightAssignment.count({
      where: { status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] } }
    });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        totalAmbulances,
        activeAssignments
      }
    });
  } catch (error) {
    console.error('Get ambulance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulance statistics',
      error: error.message
    });
  }
};

// Get ambulances by location
const getAmbulancesByLocation = async (req, res) => {
  try {
    const { location } = req.params;

    const ambulances = await Ambulance.findAll({
      where: {
        base_location: { [Op.like]: `%${location}%` }
      },
      order: [['status', 'ASC'], ['ambulance_id', 'ASC']]
    });

    res.json({
      success: true,
      data: ambulances,
      message: `Found ${ambulances.length} ambulances in ${location}`
    });
  } catch (error) {
    console.error('Get ambulances by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulances by location',
      error: error.message
    });
  }
};



// Delete ambulance
const deleteAmbulance = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for active assignments
    const activeAssignments = await FlightAssignment.count({
      where: {
        ambulance_id: id,
        status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] }
      }
    });

    if (activeAssignments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ambulance. It has ${activeAssignments} active assignment(s).`
      });
    }

    const deleted = await Ambulance.destroy({
      where: { ambulance_id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.json({
      success: true,
      message: 'Ambulance deleted successfully'
    });
  } catch (error) {
    console.error('Delete ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ambulance',
      error: error.message
    });
  }
};

module.exports = {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  getAvailableAmbulances,
  updateAmbulanceStatus,
  getAmbulanceStats,
  getAmbulancesByLocation
};