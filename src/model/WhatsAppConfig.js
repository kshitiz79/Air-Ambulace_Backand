const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppConfig = sequelize.define('WhatsAppConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  account_sid: { type: DataTypes.STRING(100), allowNull: false },
  auth_token: { type: DataTypes.STRING(100), allowNull: false },
  from_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Twilio WhatsApp sender number e.g. +14155238886'
  },
  extra_numbers: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated extra numbers to always notify e.g. +919876543210,+919123456789'
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  updated_by: { type: DataTypes.BIGINT, allowNull: true },
}, {
  tableName: 'whatsapp_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WhatsAppConfig;
