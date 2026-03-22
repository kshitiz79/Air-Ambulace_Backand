// services/whatsappService.js
// Sends WhatsApp messages via Twilio using config stored in DB

const getConfig = async () => {
  try {
    const WhatsAppConfig = require('../model/WhatsAppConfig');
    const config = await WhatsAppConfig.findOne({ where: { is_active: true } });
    return config;
  } catch {
    return null;
  }
};

/**
 * Normalize a phone number to E.164 format
 */
const normalizePhone = (num) => {
  if (!num) return null;
  num = num.replace(/[\s\-]/g, '');
  if (/^\d{10}$/.test(num)) return '+91' + num;
  if (/^91\d{10}$/.test(num)) return '+' + num;
  if (!num.startsWith('+')) return '+' + num;
  return num;
};

/**
 * @param {string} to - recipient phone in E.164 format e.g. +919876543210
 * @param {string} body - message text
 * @param {object} twilioConfig - { account_sid, auth_token, from_number }
 */
const sendWhatsApp = async (to, body, twilioConfig) => {
  const twilio = require('twilio');
  const client = twilio(twilioConfig.account_sid, twilioConfig.auth_token);
  const from = twilioConfig.from_number.startsWith('whatsapp:')
    ? twilioConfig.from_number
    : `whatsapp:${twilioConfig.from_number}`;
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  return client.messages.create({ from, to: toFormatted, body });
};

/**
 * Send enquiry creation notifications to:
 * - CMHO who created the enquiry (their phone from users table)
 * - Collector of that district (their phone from users table)
 * - Extra numbers configured in admin panel
 */
const sendEnquiryCreatedNotifications = async ({ enquiry, cmhoPhone, collectorPhone, patientName, enquiryCode, districtName }) => {
  try {
    const config = await getConfig();
    if (!config || !config.is_active) {
      console.log('WhatsApp notifications disabled or not configured.');
      return;
    }

    const message = `🚑 *Air Ambulance Enquiry Created*\n\n` +
      `Enquiry Code: *${enquiryCode}*\n` +
      `Patient: *${patientName}*\n` +
      `District: *${districtName || 'N/A'}*\n` +
      `Status: *PENDING*\n\n` +
      `Please log in to the portal to review this case.`;

    const twilioConfig = {
      account_sid: config.account_sid,
      auth_token: config.auth_token,
      from_number: config.from_number,
    };

    const targets = [];

    // CMHO who created
    if (cmhoPhone) targets.push(normalizePhone(cmhoPhone));

    // Collector of that district
    if (collectorPhone) targets.push(normalizePhone(collectorPhone));

    // Extra configured numbers
    if (config.extra_numbers) {
      const extras = config.extra_numbers.split(',').map(n => normalizePhone(n.trim())).filter(Boolean);
      targets.push(...extras);
    }

    const results = await Promise.allSettled(
      targets.map(phone => sendWhatsApp(phone, message, twilioConfig))
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`WhatsApp failed for ${targets[i]}:`, r.reason?.message);
      } else {
        console.log(`WhatsApp sent to ${targets[i]}: ${r.value?.sid}`);
      }
    });
  } catch (err) {
    console.error('WhatsApp notification error:', err.message);
    // Never throw — don't break enquiry creation
  }
};

module.exports = { sendEnquiryCreatedNotifications, sendWhatsApp, getConfig, normalizePhone };
