const MedicalCondition = require('../model/MedicalCondition');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const { search, category, active } = req.query;
    const where = {};
    if (active !== undefined) where.is_active = active === 'true';
    if (category) where.category = category;
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { name_hi: { [Op.like]: `%${search}%` } },
    ];
    const data = await MedicalCondition.findAll({ where, order: [['name', 'ASC']] });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, name_hi, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const item = await MedicalCondition.create({ name, name_hi, category });
    res.status(201).json({ success: true, data: item, message: 'Medical condition created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await MedicalCondition.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.update(req.body);
    res.json({ success: true, data: item, message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await MedicalCondition.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.destroy();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
