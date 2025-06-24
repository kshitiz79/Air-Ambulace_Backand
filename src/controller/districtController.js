const District = require("./../model/District");


exports.getAllDistricts = async (req, res) => {
  try {
    const districts = await District.findAll();
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch districts" });
  }
};


exports.createDistrict = async (req, res) => {
  try {
    const { district_name, post_office_name, pincode, state } = req.body;

    const existing = await District.findOne({ where: { district_name } });
    if (existing) {
      return res.status(400).json({ error: "District already exists" });
    }

    const newDistrict = await District.create({
      district_name,
      post_office_name,
      pincode,
      state
    });

    res.status(201).json(newDistrict);
  } catch (error) {
    res.status(500).json({ error: "Failed to create district" });
  }
};

// Get district by ID
exports.getDistrictById = async (req, res) => {
  try {
    const district = await District.findByPk(req.params.id);
    if (!district) {
      return res.status(404).json({ error: "District not found" });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch district" });
  }
};

// Delete district
exports.deleteDistrict = async (req, res) => {
  try {
    const rowsDeleted = await District.destroy({
      where: { district_id: req.params.id }
    });

    if (rowsDeleted === 0) {
      return res.status(404).json({ error: "District not found" });
    }

    res.status(200).json({ message: "District deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete district" });
  }
};
