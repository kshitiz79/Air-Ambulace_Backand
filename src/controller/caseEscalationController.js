const { CaseEscalation, Enquiry, User, Hospital, District } = require('../model');
const { ValidationError, ForeignKeyConstraintError } = require('sequelize');

// Get all escalations
exports.getAllEscalations = async (req, res) => {
  try {
    const escalations = await CaseEscalation.findAll({
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status'],
          include: [
            { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
            { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
            { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
          ]
        },
        {
          model: User,
          as: 'escalatedBy',
          attributes: ['user_id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
    });

    // Transform data to match frontend expectations
    const transformedEscalations = escalations.map(escalation => ({
      escalation_id: escalation.escalation_id,
      enquiry_id: escalation.enquiry_id,
      escalation_reason: escalation.escalation_reason,
      escalated_to: escalation.escalated_to,
      status: escalation.status,
      created_at: escalation.created_at,
      resolved_at: escalation.resolved_at,
      patient_name: escalation.enquiry?.patient_name,
      enquiry_code: escalation.enquiry?.enquiry_code,
      enquiry_status: escalation.enquiry?.status,
      escalated_by: escalation.escalatedBy,
      hospital: escalation.enquiry?.hospital,
      sourceHospital: escalation.enquiry?.sourceHospital,
      district: escalation.enquiry?.district,
    }));

    res.json({ success: true, data: transformedEscalations });
  } catch (err) {
    console.error('Error fetching escalations:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch escalations', error: err.message });
  }
};

// Get escalation by ID
exports.getEscalationById = async (req, res) => {
  try {
    const { id } = req.params;
    const escalation = await CaseEscalation.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          include: [
            { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
            { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
            { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
          ]
        },
        {
          model: User,
          as: 'escalatedBy',
          attributes: ['user_id', 'username', 'email']
        }
      ],
    });

    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }

    res.json({ success: true, data: escalation });
  } catch (err) {
    console.error('Error fetching escalation:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch escalation', error: err.message });
  }
};

// Create new escalation
exports.createEscalation = async (req, res) => {
  try {
    const { enquiry_id, escalation_reason, escalated_to, escalated_by_user_id } = req.body;

    // Validate required fields
    if (!enquiry_id || !escalation_reason || !escalated_to || !escalated_by_user_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: enquiry_id, escalation_reason, escalated_to, escalated_by_user_id'
      });
    }

    // Check if enquiry exists
    const enquiry = await Enquiry.findByPk(enquiry_id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // Create escalation
    const escalation = await CaseEscalation.create({
      enquiry_id,
      escalation_reason,
      escalated_to,
      escalated_by_user_id,
      status: 'PENDING'
    });

    // Update enquiry status to ESCALATED
    await enquiry.update({ status: 'ESCALATED' });

    // Fetch the created escalation with associations
    const createdEscalation = await CaseEscalation.findByPk(escalation.escalation_id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status']
        },
        {
          model: User,
          as: 'escalatedBy',
          attributes: ['user_id', 'username', 'email']
        }
      ],
    });

    res.status(201).json({ success: true, data: createdEscalation });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference ID (enquiry_id or escalated_by_user_id)',
        error: err.message
      });
    }
    console.error('Create escalation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create escalation', error: err.message });
  }
};

// Update escalation
exports.updateEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalation_reason, escalated_to, status } = req.body;

    const escalation = await CaseEscalation.findByPk(id);
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }

    const updateData = {};
    if (escalation_reason !== undefined) updateData.escalation_reason = escalation_reason;
    if (escalated_to !== undefined) updateData.escalated_to = escalated_to;
    if (status !== undefined) {
      updateData.status = status;
      // If status is being set to RESOLVED, set resolved_at timestamp
      if (status === 'RESOLVED' && escalation.status !== 'RESOLVED') {
        updateData.resolved_at = new Date();
      }
      // If status is being changed from RESOLVED to PENDING, clear resolved_at
      if (status === 'PENDING' && escalation.status === 'RESOLVED') {
        updateData.resolved_at = null;
      }
    }

    await escalation.update(updateData);

    // Fetch updated escalation with associations
    const updatedEscalation = await CaseEscalation.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status']
        },
        {
          model: User,
          as: 'escalatedBy',
          attributes: ['user_id', 'username', 'email']
        }
      ],
    });

    res.json({ success: true, message: 'Escalation updated successfully', data: updatedEscalation });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    console.error('Update escalation error:', err);
    res.status(500).json({ success: false, message: 'Failed to update escalation', error: err.message });
  }
};

// Delete escalation
exports.deleteEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const escalation = await CaseEscalation.findByPk(id, {
      include: [{ model: Enquiry, as: 'enquiry' }]
    });
    
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }

    // Check if there are other escalations for this enquiry
    const otherEscalations = await CaseEscalation.count({
      where: {
        enquiry_id: escalation.enquiry_id,
        escalation_id: { [require('sequelize').Op.ne]: id }
      }
    });

    // Delete the escalation
    await escalation.destroy();

    // If no other escalations exist for this enquiry, revert enquiry status
    if (otherEscalations === 0 && escalation.enquiry) {
      await escalation.enquiry.update({ status: 'PENDING' });
    }

    res.json({ success: true, message: 'Escalation deleted successfully' });
  } catch (err) {
    console.error('Delete escalation error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete escalation', error: err.message });
  }
};

// Resolve escalation
exports.resolveEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_note } = req.body;

    const escalation = await CaseEscalation.findByPk(id);
    if (!escalation) {
      return res.status(404).json({ success: false, message: 'Escalation not found' });
    }

    if (escalation.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Escalation already resolved' });
    }

    await escalation.update({
      status: 'RESOLVED',
      resolved_at: new Date(),
      resolution_note: resolution_note || null
    });

    const updatedEscalation = await CaseEscalation.findByPk(id, {
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status']
        },
        {
          model: User,
          as: 'escalatedBy',
          attributes: ['user_id', 'username', 'email']
        }
      ],
    });

    res.json({ success: true, message: 'Escalation resolved successfully', data: updatedEscalation });
  } catch (err) {
    console.error('Resolve escalation error:', err);
    res.status(500).json({ success: false, message: 'Failed to resolve escalation', error: err.message });
  }
};