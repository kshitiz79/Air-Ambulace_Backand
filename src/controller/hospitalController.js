const { Hospital, District } = require('../model');

const hospitalController = {
  async getAllHospitals(req, res) {
    try {
      const hospitals = await Hospital.findAll({
        // Remove attributes restriction to include all hospital fields
        // Keep alias for hospital_name as name for frontend consistency
        attributes: {
          include: [['hospital_name', 'name']],
          // Optionally exclude hospital_name to avoid duplication
          exclude: ['hospital_name'],
        },
        include: [
          {
            model: District,
            as: 'district',
            attributes: ['district_id', 'district_name'],
          },
        ],
      });
      // Hospitals fetched successfully
      res.json({ success: true, data: hospitals });
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hospitals', error: error.message });
    }
  },

  async createHospital(req, res) {
    try {
      const {
        hospital_name,
        district_id,
        address,
        contact_phone,
        contact_email,
        hospital_type,
        contact_person_name,
        contact_person_phone,
        contact_person_email,
        registration_number,
      } = req.body;

      // Validation — only hospital_name is required now
      if (!hospital_name) {
        return res.status(400).json({ success: false, message: 'Hospital name is required' });
      }
      if (hospital_type && !['GOVERNMENT', 'PRIVATE'].includes(hospital_type)) {
        return res.status(400).json({ success: false, message: 'Hospital type must be GOVERNMENT or PRIVATE' });
      }
      if (contact_phone && !/^\d{10}$/.test(contact_phone)) {
        return res.status(400).json({ success: false, message: 'Contact phone must be 10 digits' });
      }
      if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
        return res.status(400).json({ success: false, message: 'Invalid contact email' });
      }
      if (contact_person_phone && !/^\d{10}$/.test(contact_person_phone)) {
        return res.status(400).json({ success: false, message: 'Contact person phone must be 10 digits' });
      }
      if (contact_person_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_person_email)) {
        return res.status(400).json({ success: false, message: 'Invalid contact person email' });
      }

      // Optionally check if district_id exists (only when provided)
      if (district_id) {
        const district = await District.findByPk(district_id);
        if (!district) {
          return res.status(400).json({ success: false, message: 'Invalid district_id' });
        }
      }

      const newHospital = await Hospital.create({
        hospital_name,
        district_id,
        address,
        contact_phone,
        contact_email,
        hospital_type,
        contact_person_name,
        contact_person_phone,
        contact_person_email,
        registration_number,
      });

      // Return the hospital with aliased name field for consistency
      res.status(201).json({
        success: true,
        data: {
          hospital_id: newHospital.hospital_id,
          name: newHospital.hospital_name,
          district_id: newHospital.district_id,
          address: newHospital.address,
          contact_phone: newHospital.contact_phone,
          contact_email: newHospital.contact_email,
          hospital_type: newHospital.hospital_type,
          contact_person_name: newHospital.contact_person_name,
          contact_person_phone: newHospital.contact_person_phone,
          contact_person_email: newHospital.contact_person_email,
          registration_number: newHospital.registration_number,
        },
      });
    } catch (error) {
      console.error('Error creating hospital:', error);
      res.status(500).json({ success: false, message: 'Failed to create hospital', error: error.message });
    }
  },

  async bulkCreateHospitals(req, res) {
    try {
      const hospitals = req.body;
      if (!Array.isArray(hospitals)) {
        return res.status(400).json({ success: false, message: 'Invalid data format, expected an array' });
      }
      
      // Basic validation for each hospital - check for hospital_name and district_id
      const validHospitals = hospitals.filter(h => (h.hospital_name || h.name) && h.district_id);
      
      if (validHospitals.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid hospital records found' });
      }

      // Map 'name' to 'hospital_name' for bulk creation
      const hospitalData = validHospitals.map(h => ({
        hospital_name: h.hospital_name || h.name,
        district_id: h.district_id,
        address: h.address || '',
        contact_phone: h.contact_phone || '',
        contact_email: h.contact_email || '',
        hospital_type: (h.hospital_type && ['GOVERNMENT', 'PRIVATE'].includes(h.hospital_type.toUpperCase())) ? h.hospital_type.toUpperCase() : 'PRIVATE',
        contact_person_name: h.contact_person_name || '',
        contact_person_phone: h.contact_person_phone || '',
        contact_person_email: h.contact_person_email || '',
        registration_number: h.registration_number || '',
      }));

      const created = await Hospital.bulkCreate(hospitalData, { ignoreDuplicates: true });
      res.status(201).json({ success: true, message: `${created.length} hospitals processed`, data: created });
    } catch (error) {
      console.error('Error bulk creating hospitals:', error);
      res.status(500).json({ success: false, message: 'Failed to bulk create hospitals', error: error.message });
    }
  },
};

module.exports = hospitalController;