const WhatsAppConfig = require('../model/WhatsAppConfig');
const { sendWhatsApp } = require('../services/whatsappService');

// GET current config (mask auth_token)
exports.getConfig = async (req, res) => {
  try {
    const config = await WhatsAppConfig.findOne({ order: [['id', 'DESC']] });
    if (!config) return res.json({ success: true, data: null });

    const safe = config.toJSON();
    // Mask auth token — show only last 6 chars
    if (safe.auth_token) {
      safe.auth_token = '••••••••••••••••••••' + safe.auth_token.slice(-6);
    }
    res.json({ success: true, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST save/update config
exports.saveConfig = async (req, res) => {
  try {
    const { account_sid, auth_token, from_number, extra_numbers, is_active } = req.body;
    const userId = req.user?.user_id;

    let config = await WhatsAppConfig.findOne({ order: [['id', 'DESC']] });

    if (config) {
      const updateData = { account_sid, from_number, extra_numbers, is_active, updated_by: userId };
      // Only update auth_token if a real value is provided (not masked)
      if (auth_token && !auth_token.startsWith('••')) {
        updateData.auth_token = auth_token;
      }
      await config.update(updateData);
    } else {
      config = await WhatsAppConfig.create({
        account_sid, auth_token, from_number, extra_numbers,
        is_active: is_active !== undefined ? is_active : true,
        updated_by: userId,
      });
    }

    res.json({ success: true, message: 'WhatsApp configuration saved.', data: { id: config.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST test — send a test message
exports.testMessage = async (req, res) => {
  try {
    let { test_number } = req.body;
    if (!test_number) return res.status(400).json({ success: false, message: 'test_number is required' });

    // Normalize to E.164 — strip spaces/dashes, add +91 if bare 10-digit Indian number
    test_number = test_number.replace(/[\s\-]/g, '');
    if (/^\d{10}$/.test(test_number)) test_number = '+91' + test_number;
    else if (/^91\d{10}$/.test(test_number)) test_number = '+' + test_number;
    else if (!test_number.startsWith('+')) test_number = '+' + test_number;

    const config = await WhatsAppConfig.findOne({ order: [['id', 'DESC']] });
    if (!config) return res.status(400).json({ success: false, message: 'No WhatsApp config found. Save config first.' });

    const result = await sendWhatsApp(
      test_number,
      '✅ Test message from Air Ambulance Portal. WhatsApp notifications are working!',
      { account_sid: config.account_sid, auth_token: config.auth_token, from_number: config.from_number }
    );

    res.json({ success: true, message: `Test message sent to ${test_number}`, sid: result.sid });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send test message: ' + err.message });
  }
};
