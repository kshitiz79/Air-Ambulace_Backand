const EmailConfig = require('../model/EmailConfig');

// GET /api/email-config
const getConfig = async (req, res) => {
  try {
    let config = await EmailConfig.findOne({ order: [['id', 'DESC']] });
    if (!config) config = await EmailConfig.create({ extra_emails: '', is_active: true });
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/email-config
const saveConfig = async (req, res) => {
  try {
    const { extra_emails, is_active } = req.body;
    let config = await EmailConfig.findOne({ order: [['id', 'DESC']] });
    if (config) {
      await config.update({ extra_emails, is_active, updated_by: req.user?.user_id });
    } else {
      config = await EmailConfig.create({ extra_emails, is_active, updated_by: req.user?.user_id });
    }
    res.json({ success: true, data: config, message: 'Email config saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getConfig, saveConfig };
