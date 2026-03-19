const { Op } = require('sequelize');
const ReferralAuthority = require('../model/ReferralAuthority');

// GET /api/referral-authorities?type=PHYSICIAN&search=sharma
const getAll = async (req, res) => {
  try {
    const { type, search, hospital_id, district_id } = req.query;
    const where = { is_active: true };

    if (type) where.type = type.toUpperCase();
    if (hospital_id) where.hospital_id = hospital_id;
    if (district_id) where.district_id = district_id;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
      ];
    }

    const data = await ReferralAuthority.findAll({ where, order: [['name', 'ASC']], limit: 50 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/referral-authorities  (single)
const create = async (req, res) => {
  try {
    const record = await ReferralAuthority.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/referral-authorities/bulk  (array upload from admin)
const bulkCreate = async (req, res) => {
  try {
    const rows = req.body; // array of { name, designation, type, hospital_id?, district_id? }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a non-empty array' });
    }
    const created = await ReferralAuthority.bulkCreate(rows, { ignoreDuplicates: true });
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/referral-authorities/:id
const update = async (req, res) => {
  try {
    const record = await ReferralAuthority.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    await record.update(req.body);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/referral-authorities/:id  (soft delete)
const remove = async (req, res) => {
  try {
    const record = await ReferralAuthority.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    await record.update({ is_active: false });
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, bulkCreate, update, remove };
