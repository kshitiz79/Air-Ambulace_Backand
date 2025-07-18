const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseEscalation = sequelize.define('CaseEscalation', {
  escalation_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  enquiry_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'enquiries',
      key: 'enquiry_id',
    },
  },
  escalated_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  escalation_reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  escalated_to: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RESOLVED'),
    defaultValue: 'PENDING',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'case_escalations',
  timestamps: false,
});

CaseEscalation.associate = (models) => {
  // Association with Enquiry
  CaseEscalation.belongsTo(models.Enquiry, {
    foreignKey: 'enquiry_id',
    as: 'enquiry',
  });

  // Association with User (who escalated)
  CaseEscalation.belongsTo(models.User, {
    foreignKey: 'escalated_by_user_id',
    as: 'escalatedBy',
  });
};

module.exports = CaseEscalation;