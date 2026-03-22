const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Maps to the existing `system_logs` table, extended with activity tracking columns
const SystemLog = sequelize.define('SystemLog', {
  log_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  resource_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED', 'WARNING'),
    defaultValue: 'SUCCESS',
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'system_logs',
  timestamps: false,
});

// Association: join to users table for full_name
const User = require('./User');
SystemLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = SystemLog;
