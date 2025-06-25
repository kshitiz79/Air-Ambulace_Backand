const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
  enquiry_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  patient_name: { type: DataTypes.STRING(100), allowNull: false },
  ayushman_card_number: { type: DataTypes.STRING(20), allowNull: true },
  aadhar_card_number: { type: DataTypes.STRING(12), allowNull: true },
  pan_card_number: { type: DataTypes.STRING(10), allowNull: true },
  medical_condition: { type: DataTypes.TEXT, allowNull: false },
  hospital_id: { type: DataTypes.BIGINT, allowNull: false },
  source_hospital_id: { type: DataTypes.BIGINT, allowNull: false },
  contact_name: { type: DataTypes.STRING(100), allowNull: false },
  contact_phone: { type: DataTypes.STRING(10), allowNull: false },
  contact_email: { type: DataTypes.STRING(100), allowNull: false },
  submitted_by_user_id: { type: DataTypes.BIGINT, allowNull: false },
  district_id: { type: DataTypes.BIGINT, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'FORWARDED', 'APPROVED', 'REJECTED', 'ESCALATED', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'PENDING'
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  father_spouse_name: { type: DataTypes.STRING(100), allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  chief_complaint: { type: DataTypes.TEXT, allowNull: false },
  general_condition: { type: DataTypes.STRING(50), allowNull: false },
  vitals: { type: DataTypes.ENUM('Stable', 'Unstable'), allowNull: false },
  referring_physician_name: { type: DataTypes.STRING(100), allowNull: false },
  referring_physician_designation: { type: DataTypes.STRING(100), allowNull: false },
  referral_note: { type: DataTypes.TEXT, allowNull: true },
  transportation_category: {
    type: DataTypes.ENUM('Within Division', 'Out of Division', 'Out of State'),
    allowNull: false
  },
  air_transport_type: { type: DataTypes.ENUM('Free', 'Paid'), allowNull: false },
  recommending_authority_name: { type: DataTypes.STRING(100), allowNull: false },
  recommending_authority_designation: { type: DataTypes.STRING(100), allowNull: false },
  approval_authority_name: { type: DataTypes.STRING(100), allowNull: false },
  approval_authority_designation: { type: DataTypes.STRING(100), allowNull: false },
  bed_availability_confirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  als_ambulance_arranged: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ambulance_registration_number: { type: DataTypes.STRING(50), allowNull: true },
  ambulance_contact: { type: DataTypes.STRING(15), allowNull: true },
  medical_team_note: { type: DataTypes.TEXT, allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'enquiries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  validate: {
    checkIdentityFields() {
      if (!this.ayushman_card_number && (!this.aadhar_card_number || !this.pan_card_number)) {
        throw new Error('Either ayushman_card_number or both aadhar_card_number and pan_card_number must be provided');
      }
    }
  }
});

Enquiry.associate = models => {
  Enquiry.belongsTo(models.User, { foreignKey: 'submitted_by_user_id', as: 'submittedBy' });
  Enquiry.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
  Enquiry.belongsTo(models.Hospital, { foreignKey: 'source_hospital_id', as: 'sourceHospital' });
  Enquiry.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
  Enquiry.hasMany(models.Document, { foreignKey: 'enquiry_id', as: 'documents' });
};

module.exports = Enquiry;