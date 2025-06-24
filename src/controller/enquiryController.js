const { Enquiry, Document, User, Hospital, District } = require('../model');

// Create Enquiry + documents
exports.createEnquiry = async (req, res) => {
  try {
    // 1) Create enquiry record from text fields
    const enquiry = await Enquiry.create({
      patient_name: req.body.patient_name,
      ayushman_card_number: req.body.ayushman_card_number,
      aadhar_card_number: req.body.aadhar_card_number,
      pan_card_number: req.body.pan_card_number,
      medical_condition: req.body.medical_condition,
      hospital_id: req.body.hospital_id,
      source_hospital_id: req.body.source_hospital_id,
      district_id: req.body.district_id,
      contact_name: req.body.contact_name,
      contact_phone: req.body.contact_phone,
      contact_email: req.body.contact_email,
      submitted_by_user_id: req.body.submitted_by_user_id,
    });

    // 2) Process uploaded documents
    if (req.files) {
      const docsToCreate = [];
      for (const [document_type, files] of Object.entries(req.files)) {
        files.forEach(file => {
          docsToCreate.push({
            enquiry_id: enquiry.enquiry_id,
            document_type, // Matches ENUM: AYUSHMAN_CARD, ID_PROOF, etc.
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create enquiry', error: err.message });
  }
};

// Other handlers (unchanged)


exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.findAll({
      attributes: [
        'enquiry_id',
        'patient_name',
        'status',
        'hospital_id',
        'source_hospital_id',
        'district_id',
        'medical_condition',
        'ayushman_card_number',
        'contact_name',
        'contact_phone',
        'contact_email',
      ],
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['document_id', 'document_type', 'file_path'],
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['user_id'],
        },
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['hospital_id', ['hospital_name', 'name']],
        },
        {
          model: Hospital,
          as: 'sourceHospital',
          attributes: ['hospital_id', ['hospital_name', 'name']],
        },
        {
          model: District,
          as: 'district',
          attributes: ['district_id', 'district_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    console.log('Fetched enquiries:', JSON.stringify(enquiries, null, 2));
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

// ... other functions (createEnquiry, deleteEnquiry, verifyEnquiry) remain unchanged
// ... other functions (createEnquiry, deleteEnquiry, verifyEnquiry) remain unchanged
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Enquiry.destroy({ where: { enquiry_id: id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    console.error(err);
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
    enquiry.status = 'VERIFIED';
    await enquiry.save();
    res.json({ success: true, message: 'Enquiry marked as VERIFIED', data: enquiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to verify enquiry', error: err.message });
  }
};


exports.approveOrRejectEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // Expect 'APPROVE' or 'REJECT'
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
    res.json({ success: true, message: `Enquiry ${action.toLowerCase()} successfully`, data: enquiry });
  } catch (err) {
    console.error('Error updating enquiry status:', err);
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
    console.error('Error forwarding enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to forward enquiry', error: err.message });
  }
};





exports.updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // Update text fields
    const updateData = {
      patient_name: req.body.patient_name,
      ayushman_card_number: req.body.ayushman_card_number,
      aadhar_card_number: req.body.aadhar_card_number,
      pan_card_number: req.body.pan_card_number,
      medical_condition: req.body.medical_condition,
      hospital_id: req.body.hospital_id,
      source_hospital_id: req.body.source_hospital_id,
      district_id: req.body.district_id,
      contact_name: req.body.contact_name,
      contact_phone: req.body.contact_phone,
      contact_email: req.body.contact_email,
    };

    await enquiry.update(updateData);

    // Update documents (delete existing and create new ones if provided)
    if (req.files) {
      await Document.destroy({ where: { enquiry_id: id } });
      const docsToCreate = [];
      for (const [document_type, files] of Object.entries(req.files)) {
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

    // Fetch updated enquiry with associations
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
    console.error('Error updating enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to update enquiry', error: err.message });
  }
};