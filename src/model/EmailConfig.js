const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailConfig = sequelize.define('EmailConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  extra_emails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated extra emails to always notify on enquiry creation',
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  updated_by: { type: DataTypes.BIGINT, allowNull: true },
}, {
  tableName: 'email_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmailConfig;
