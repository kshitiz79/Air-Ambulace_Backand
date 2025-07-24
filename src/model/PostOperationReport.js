const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostOperationReport = sequelize.define('PostOperationReport', {
  report_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  enquiry_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'enquiries',
      key: 'enquiry_id'
    }
  },
  flight_log: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  patient_transfer_status: {
    type: DataTypes.ENUM('SUCCESSFUL', 'FAILED'),
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submitted_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'post_operation_reports',
  timestamps: false,
  comment: 'Stores post-operation reports'
});

module.exports = PostOperationReport;