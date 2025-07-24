const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseClosure = sequelize.define('CaseClosure', {
  closure_id: {
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
  closure_reason: {
    type: DataTypes.ENUM('SERVICE_COMPLETED', 'PATIENT_TRANSFERRED', 'DOCUMENTATION_COMPLETE', 'PAYMENT_CLEARED'),
    allowNull: false,
  },
  final_remarks: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  documents_submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  payment_cleared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  patient_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  closure_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  closure_status: {
    type: DataTypes.ENUM('PENDING', 'CLOSED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  closed_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  closure_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'case_closures',
  timestamps: false,
  comment: 'Stores case closure information'
});

module.exports = CaseClosure;