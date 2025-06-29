const { Enquiry, Document, User, Hospital, District } = require('../model');
const { ValidationError, ForeignKeyConstraintError } = require('sequelize');

exports.createEnquiry = async (req, res) => {
  try {
    const {
      patient_name, ayushman_card_number, aadhar_card_number, pan_card_number, medical_condition,
      hospital_id, source_hospital_id, district_id, contact_name, contact_phone, contact_email,
      submitted_by_user_id, father_spouse_name, age, gender, address, chief_complaint,
      general_condition, vitals, referring_physician_name, referring_physician_designation,
      referral_note, transportation_category, air_transport_type, recommending_authority_name,
      recommending_authority_designation, approval_authority_name, approval_authority_designation,
      bed_availability_confirmed, als_ambulance_arranged, ambulance_registration_number,
      ambulance_contact, medical_team_note, remarks
    } = req.body;

    // Validate identity fields
    if (!ayushman_card_number && (!aadhar_card_number || !pan_card_number)) {
      return res.status(400).json({ success: false, message: 'Either ayushman_card_number or both aadhar_card_number and pan_card_number must be provided' });
    }

    // Create enquiry
    const enquiry = await Enquiry.create({
      patient_name, ayushman_card_number, aadhar_card_number, pan_card_number, medical_condition,
      hospital_id, source_hospital_id, district_id, contact_name, contact_phone, contact_email,
      submitted_by_user_id, father_spouse_name, age, gender, address, chief_complaint,
      general_condition, vitals, referring_physician_name, referring_physician_designation,
      referral_note, transportation_category, air_transport_type, recommending_authority_name,
      recommending_authority_designation, approval_authority_name, approval_authority_designation,
      bed_availability_confirmed, als_ambulance_arranged, ambulance_registration_number,
      ambulance_contact, medical_team_note, remarks
    });

    // Process uploaded documents
    if (req.files) {
      const docsToCreate = [];
      for (const [document_type, files] of Object.entries(req.files)) {
        if (!['AYUSHMAN_CARD', 'ID_PROOF', 'MEDICAL_REPORT', 'OTHER'].includes(document_type)) {
          return res.status(400).json({ success: false, message: `Invalid document_type: ${document_type}` });
        }
        files.forEach(file => {
          docsToCreate.push({
            enquiry_id: enquiry.enquiry_id,
            document_type,
            file_path: file.path,
          });
        });
      }
      if (docsToCreate.length) {
        await Document.bulkCreate(docsToCreate);
      }
    }

    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ success: false, message: 'Validation error', error: err.errors.map(e => e.message) });
    }
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ success: false, message: 'Invalid reference ID (e.g., hospital_id, user_id, or district_id)', error: err.message });
    }
    console.error('Create enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to create enquiry', error: err.message });
  }
};

exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.findAll({
      attributes: [
        'enquiry_id', 'patient_name', 'status', 'hospital_id', 'source_hospital_id', 'district_id',
        'medical_condition', 'ayushman_card_number', 'contact_name', 'contact_phone', 'contact_email'
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
    res.json({ success: true, data: enquiries });
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries', error: err.message });
  }
};

exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByPk(id, {
      include: [
        { model: Document, as: 'documents', attributes: ['document_id', 'document_type', 'file_path'] },
        { model: User, as: 'submittedBy', attributes: ['user_id'] },
        { model: Hospital, as: 'hospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: Hospital, as: 'sourceHospital', attributes: ['hospital_id', ['hospital_name', 'name']] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
      ],
    });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
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
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const { ayushman_card_number, aadhar_card_number, pan_card_number } = req.body;
    if (!ayushman_card_number && (!aadhar_card_number || !pan_card_number)) {
      return res.status(400).json({ success: false, message: 'Either ayushman_card_number or both aadhar_card_number and pan_card_number must be provided' });
    }

    const updateData = { ...req.body };
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
    const deleted = await Enquiry.destroy({ where: { enquiry_id: id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted successfully' });
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

