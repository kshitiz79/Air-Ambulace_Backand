const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
  enquiry_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ayushman_card_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  aadhar_card_number: {
    type: DataTypes.STRING(12),
    allowNull: true,
  },
  pan_card_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  medical_condition: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  hospital_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  source_hospital_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  contact_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contact_phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  contact_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  submitted_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  district_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'FORWARDED',
      'APPROVED',
      'REJECTED',
      'ESCALATED',
      'IN_PROGRESS',
      'COMPLETED'
    ),
    defaultValue: 'PENDING',
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
  tableName: 'enquiries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Enquiry.associate = (models) => {
  Enquiry.belongsTo(models.User, {
    foreignKey: 'submitted_by_user_id',
    as: 'submittedBy',
  });

  Enquiry.belongsTo(models.Hospital, {
    foreignKey: 'hospital_id',
    as: 'hospital',
  });

  Enquiry.belongsTo(models.Hospital, {
    foreignKey: 'source_hospital_id',
    as: 'sourceHospital',
  });

  Enquiry.belongsTo(models.District, {
    foreignKey: 'district_id',
    as: 'district',
  });

  Enquiry.hasMany(models.Document, {
    foreignKey: 'enquiry_id',
    as: 'documents',
  });
};

module.exports = Enquiry;
