// controller/enquiryController.js
const { Enquiry, Document, User, Hospital, District, CaseEscalation, CaseQuery } = require('../model');
const { ValidationError, ForeignKeyConstraintError } = require('sequelize');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
const { createNotificationForAllExceptCMO } = require('./notificationController');

// Middleware to extract user from JWT token (optional for backward compatibility)
const extractUserFromToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      // For backward compatibility, continue without user if no token
      req.user = null;
      return next();
    }

    // Use the same secret that's used in your auth system
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded; // Contains user_id, role, etc.
    console.log('Decoded user:', decoded); // Debug log
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    // For backward compatibility, continue without user if token is invalid
    req.user = null;
    next();
  }
};

exports.createEnquiry = async (req, res) => {
  try {
    const {
      patient_name, identity_card_type, ayushman_card_number, aadhar_card_number, pan_card_number,
      medical_condition, hospital_id, source_hospital_id, district_id,
      contact_name, contact_phone, contact_email, submitted_by_user_id,
      father_spouse_name, age, gender, address, chief_complaint,
      general_condition, vitals, referring_physician_name,
      referring_physician_designation, referral_note, transportation_category,
      air_transport_type, recommending_authority_name,
      recommending_authority_designation, approval_authority_name,
      approval_authority_designation, bed_availability_confirmed,
      als_ambulance_arranged, ambulance_registration_number,
      ambulance_contact, medical_team_note, remarks
    } = req.body;

    // Creating enquiry with provided data

    // identity-field check is now in model validation

    const enquiry = await Enquiry.create({
      patient_name,
      identity_card_type,
      ayushman_card_number,
      aadhar_card_number,
      pan_card_number,
      medical_condition,
      hospital_id,
      source_hospital_id,
      district_id,
      contact_name,
      contact_phone,
      contact_email,
      submitted_by_user_id,
      father_spouse_name,
      age,
      gender,
      address,
      chief_complaint,
      general_condition,
      vitals,
      referring_physician_name,
      referring_physician_designation,
      referral_note,
      transportation_category,
      air_transport_type,
      recommending_authority_name,
      recommending_authority_designation,
      approval_authority_name,
      approval_authority_designation,
      bed_availability_confirmed: bed_availability_confirmed === '1' || bed_availability_confirmed === true,
      als_ambulance_arranged: als_ambulance_arranged === '1' || als_ambulance_arranged === true,
      ambulance_registration_number,
      ambulance_contact,
      medical_team_note,
      remarks
    });

    // handle file uploads
    if (req.files) {
      const docs = [];
      for (const [type, files] of Object.entries(req.files)) {
        if (!['AYUSHMAN_CARD', 'ID_PROOF', 'MEDICAL_REPORT', 'OTHER'].includes(type)) {
          return res.status(400).json({ success: false, message: `Invalid document_type: ${type}` });
        }
        files.forEach(file => {
          docs.push({
            enquiry_id: enquiry.enquiry_id,
            document_type: type,
            file_path: file.path
          });
        });
      }
      if (docs.length) await Document.bulkCreate(docs);
    }

    const created = await Enquiry.findByPk(enquiry.enquiry_id, {
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: User, as: 'submittedBy', attributes: ['user_id'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] }
      ]
    });

    // Create notification for all users except CMO role
    try {
      const notificationMessage = `New enquiry created: ${created.enquiry_code} for patient ${patient_name}. Medical condition: ${medical_condition}`;
      await createNotificationForAllExceptCMO(notificationMessage, enquiry.enquiry_id);
      console.log('Notification created successfully for new enquiry:', created.enquiry_code);
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the enquiry creation if notification fails
    }

    res.status(201).json({ success: true, data: created });
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
        message: 'Invalid reference ID (e.g., hospital_id, user_id, or district_id)',
        error: err.message
      });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create enquiry', error: err.message });
  }
};

// (The rest of your getAll, getById, update, delete, verify, approve/reject, forward handlers remain unchanged)


exports.getAllEnquiries = async (req, res) => {
  try {
    // Check if user is CMO and filter accordingly
    const { user } = req;
    let whereClause = {};
    
    // If user is CMO, only show their own enquiries
    if (user && user.role === 'CMO') {
      whereClause.submitted_by_user_id = user.user_id; // Use user_id from JWT token
    }

    const enquiries = await Enquiry.findAll({
      where: whereClause,
      attributes: [
        'enquiry_id', 'enquiry_code', 'patient_name', 'status', 'hospital_id', 'source_hospital_id', 'district_id',
        'medical_condition', 'identity_card_type', 'ayushman_card_number', 'aadhar_card_number', 'pan_card_number',
        'contact_name', 'contact_phone', 'contact_email'
      ],
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: User, as: 'submittedBy', attributes: ['user_id'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ 
      success: true, 
      data: enquiries,
      filtered: user && user.role === 'CMO',
      user_id: user ? user.user_id : null
    });
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries', error: err.message });
  }
};

exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Build where clause
    let whereClause = { enquiry_id: id };
    
    // If user is CMO, only allow access to their own enquiries
    if (user && user.role === 'CMO') {
      whereClause.submitted_by_user_id = user.user_id; // Use user_id from JWT token
    }

    const enquiry = await Enquiry.findOne({
      where: whereClause,
      attributes: [
        'enquiry_id', 'enquiry_code', 'patient_name', 'status', 'hospital_id', 'source_hospital_id', 'district_id',
        'medical_condition', 'identity_card_type', 'ayushman_card_number', 'aadhar_card_number', 'pan_card_number',
        'contact_name', 'contact_phone', 'contact_email', 'father_spouse_name', 'age', 'gender', 'address', 
        'chief_complaint', 'general_condition', 'vitals', 'referring_physician_name', 'referring_physician_designation', 
        'referral_note', 'transportation_category', 'air_transport_type', 'recommending_authority_name',
        'recommending_authority_designation', 'approval_authority_name', 'approval_authority_designation',
        'bed_availability_confirmed', 'als_ambulance_arranged', 'ambulance_registration_number',
        'ambulance_contact', 'medical_team_note', 'remarks'
      ],
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: User, as: 'submittedBy', attributes: ['user_id'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
      ],
    });
    
    if (!enquiry) {
      const message = user && user.role === 'CMO' 
        ? 'Enquiry not found or you do not have access to it' 
        : 'Enquiry not found';
      return res.status(404).json({ success: false, message });
    }
    
    res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error('Error fetching enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry', error: err.message });
  }
};

exports.updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Build where clause for CMO access control
    let whereClause = { enquiry_id: id };
    
    // If user is CMO, only allow access to their own enquiries
    if (user && user.role === 'CMO') {
      whereClause.submitted_by_user_id = user.user_id;
    }
    
    const enquiry = await Enquiry.findOne({ where: whereClause });
    if (!enquiry) {
      const message = user && user.role === 'CMO' 
        ? 'Enquiry not found or you do not have access to it' 
        : 'Enquiry not found';
      return res.status(404).json({ success: false, message });
    }

    // Only validate identity cards if they are being updated
    const { ayushman_card_number, aadhar_card_number, pan_card_number } = req.body;
    const isUpdatingIdentity = ayushman_card_number !== undefined || aadhar_card_number !== undefined || pan_card_number !== undefined;
    
    if (isUpdatingIdentity) {
      const finalAyushman = ayushman_card_number !== undefined ? ayushman_card_number : enquiry.ayushman_card_number;
      const finalAadhar = aadhar_card_number !== undefined ? aadhar_card_number : enquiry.aadhar_card_number;
      const finalPan = pan_card_number !== undefined ? pan_card_number : enquiry.pan_card_number;
      
      if (!finalAyushman && (!finalAadhar || !finalPan)) {
        return res.status(400).json({ success: false, message: 'Either ayushman_card_number or both aadhar_card_number and pan_card_number must be provided' });
      }
    }

    const updateData = { ...req.body };
    
    // Debug logging for district updates
    if (updateData.district_id) {
      console.log('Updating district_id from', enquiry.district_id, 'to', updateData.district_id);
      console.log('User role:', user?.role, 'User ID:', user?.user_id);
    }
    
    await enquiry.update(updateData);

    if (req.files) {
      await Document.destroy({ where: { enquiry_id: id } });
      const docsToCreate = [];
      for (const [document_type, files] of Object.entries(req.files)) {
        if (!['AYUSHMAN_CARD', 'ID_PROOF', 'MEDICAL_REPORT', 'OTHER'].includes(document_type)) {
          return res.status(400).json({ success: false, message: `Invalid document_type: ${document_type}` });
        }
        files.forEach(file => {
          docsToCreate.push({
            enquiry_id: id,
            document_type,
            file_path: file.path,
          });
        });
      }
      if (docsToCreate.length) {
        await Document.bulkCreate(docsToCreate);
      }
    }

    const updatedEnquiry = await Enquiry.findByPk(id, {
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
      ],
    });

    res.json({ success: true, message: 'Enquiry updated successfully', data: updatedEnquiry });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ success: false, message: 'Validation error', error: err.errors.map(e => e.message) });
    }
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ success: false, message: 'Invalid reference ID (e.g., hospital_id, user_id, or district_id)', error: err.message });
    }
    console.error('Update enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to update enquiry', error: err.message });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if enquiry exists
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // Delete related records first to avoid foreign key constraint errors
    // Delete documents associated with this enquiry
    await Document.destroy({ where: { enquiry_id: id } });
    
    // Delete case escalations associated with this enquiry
    await CaseEscalation.destroy({ where: { enquiry_id: id } });
    
    // Delete case queries associated with this enquiry
    await CaseQuery.destroy({ where: { enquiry_id: id } });
    
    // Now delete the enquiry
    const deleted = await Enquiry.destroy({ where: { enquiry_id: id } });
    
    res.json({ success: true, message: 'Enquiry and all related records deleted successfully' });
  } catch (err) {
    console.error('Delete enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete enquiry', error: err.message });
  }
};

exports.verifyEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    if (enquiry.status === 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'Enquiry already verified' });
    }
    enquiry.status = 'VERIFIED';
    await enquiry.save();
    res.json({ success: true, message: 'Enquiry marked as VERIFIED', data: enquiry });
  } catch (err) {
    console.error('Verify enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify enquiry', error: err.message });
  }
};

exports.approveOrRejectEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use APPROVE or REJECT' });
    }
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    if (enquiry.status === 'APPROVED' || enquiry.status === 'REJECTED') {
      return res.status(400).json({ success: false, message: `Enquiry already ${enquiry.status.toLowerCase()}` });
    }
    enquiry.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await enquiry.save();
    res.json({ success: true, message: `Enquiry ${action.toLowerCase()}d successfully`, data: enquiry });
  } catch (err) {
    console.error('Approve/Reject enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to update enquiry status', error: err.message });
  }
};

exports.forwardEnquiryToDM = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    if (enquiry.status === 'FORWARDED') {
      return res.status(400).json({ success: false, message: 'Enquiry already forwarded to DM' });
    }
    enquiry.status = 'FORWARDED';
    await enquiry.save();
    res.json({ success: true, message: 'Enquiry forwarded to DM', data: enquiry });
  } catch (err) {
    console.error('Forward enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to forward enquiry', error: err.message });
  }
};

exports.escalateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalation_reason, escalated_to, escalated_by_user_id } = req.body;

    // Validate required fields
    if (!escalation_reason || !escalated_to || !escalated_by_user_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: escalation_reason, escalated_to, escalated_by_user_id'
      });
    }

    // Check if enquiry exists
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // Check if enquiry is already escalated
    if (enquiry.status === 'ESCALATED') {
      return res.status(400).json({ success: false, message: 'Enquiry already escalated' });
    }

    // Create escalation record
    const escalation = await CaseEscalation.create({
      enquiry_id: id,
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

    res.status(201).json({
      success: true,
      message: 'Enquiry escalated successfully',
      data: createdEscalation
    });
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
    console.error('Escalate enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to escalate enquiry', error: err.message });
  }
};

exports.searchEnquiries = async (req, res) => {
  try {
    const { 
      patient_name, 
      father_spouse_name, 
      ayushman_card_number, 
      aadhar_card_number, 
      pan_card_number, 
      contact_email,
      contact_phone,
      enquiry_code,
      status 
    } = req.query;

    const { user } = req;

    // Build search conditions
    const { Op } = require('sequelize');
    const whereConditions = {};

    // If user is CMO, only search their own enquiries
    if (user && user.role === 'CMO') {
      whereConditions.submitted_by_user_id = user.user_id; // Use user_id from JWT token
    }

    if (patient_name) {
      whereConditions.patient_name = { [Op.like]: `%${patient_name}%` };
    }
    if (father_spouse_name) {
      whereConditions.father_spouse_name = { [Op.like]: `%${father_spouse_name}%` };
    }
    if (ayushman_card_number) {
      whereConditions.ayushman_card_number = { [Op.like]: `%${ayushman_card_number}%` };
    }
    if (aadhar_card_number) {
      whereConditions.aadhar_card_number = { [Op.like]: `%${aadhar_card_number}%` };
    }
    if (pan_card_number) {
      whereConditions.pan_card_number = { [Op.like]: `%${pan_card_number}%` };
    }
    if (contact_email) {
      whereConditions.contact_email = { [Op.like]: `%${contact_email}%` };
    }
    if (contact_phone) {
      whereConditions.contact_phone = { [Op.like]: `%${contact_phone}%` };
    }
    if (enquiry_code) {
      whereConditions.enquiry_code = { [Op.like]: `%${enquiry_code}%` };
    }
    if (status && status !== 'ALL') {
      whereConditions.status = status;
    }

    const enquiries = await Enquiry.findAll({
      where: whereConditions,
      attributes: [
        'enquiry_id', 'enquiry_code', 'patient_name', 'status', 'hospital_id', 'source_hospital_id', 'district_id',
        'medical_condition', 'ayushman_card_number', 'aadhar_card_number', 'pan_card_number',
        'contact_name', 'contact_phone', 'contact_email', 'father_spouse_name', 'age', 'gender',
        'created_at', 'updated_at'
      ],
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: User, as: 'submittedBy', attributes: ['user_id', 'full_name'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 50 // Limit results for performance
    });

    res.json({ 
      success: true, 
      data: enquiries,
      count: enquiries.length,
      filtered: user && user.role === 'CMO',
      user_id: user ? user.user_id : null,
      message: `Found ${enquiries.length} enquiries matching your search criteria`
    });
  } catch (err) {
    console.error('Search enquiries error:', err);
    res.status(500).json({ success: false, message: 'Failed to search enquiries', error: err.message });
  }
};

// Get dashboard statistics for CMO (only their own enquiries)
exports.getCMODashboardStats = async (req, res) => {
  try {
    const { user } = req;

    if (!user || user.role !== 'CMO') {
      return res.status(403).json({ success: false, message: 'Access denied. CMO role required.' });
    }

    // Get counts for different statuses (only for current CMO)
    const stats = await Enquiry.findAll({
      where: { submitted_by_user_id: user.user_id }, // Use user_id from JWT token
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('enquiry_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Format the statistics
    const formattedStats = {
      totalEnquiries: 0,
      pendingEnquiries: 0,
      approvedEnquiries: 0,
      rejectedEnquiries: 0,
      escalatedEnquiries: 0,
      completedEnquiries: 0,
      forwardedEnquiries: 0,
      inProgressEnquiries: 0
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      formattedStats.totalEnquiries += count;
      
      switch (stat.status) {
        case 'PENDING':
          formattedStats.pendingEnquiries = count;
          break;
        case 'APPROVED':
          formattedStats.approvedEnquiries = count;
          break;
        case 'REJECTED':
          formattedStats.rejectedEnquiries = count;
          break;
        case 'ESCALATED':
          formattedStats.escalatedEnquiries = count;
          break;
        case 'COMPLETED':
          formattedStats.completedEnquiries = count;
          break;
        case 'FORWARDED':
          formattedStats.forwardedEnquiries = count;
          break;
        case 'IN_PROGRESS':
          formattedStats.inProgressEnquiries = count;
          break;
      }
    });

    res.json({
      success: true,
      data: formattedStats,
      user_id: user.user_id,
      filtered: true
    });

  } catch (error) {
    console.error('Error fetching CMO dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Export the middleware as well
exports.extractUserFromToken = extractUserFromToken;

