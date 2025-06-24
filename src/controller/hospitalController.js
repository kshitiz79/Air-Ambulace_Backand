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
      console.log('Fetched hospitals:', JSON.stringify(hospitals, null, 2)); // Debug log
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

      // Validation
      if (!hospital_name || !district_id) {
        return res.status(400).json({ success: false, message: 'Hospital name and district ID are required' });
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

      // Check if district_id exists
      const district = await District.findByPk(district_id);
      if (!district) {
        return res.status(400).json({ success: false, message: 'Invalid district_id' });
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
};

module.exports = hospitalController;