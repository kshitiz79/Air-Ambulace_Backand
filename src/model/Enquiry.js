// model/Enquiry.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
  enquiry_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  enquiry_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    // no regex validate — format is now DISTPREFIX-XXXXXXXXXX
  },
  patient_name: { type: DataTypes.STRING(100), allowNull: false },
  identity_card_type: { 
    type: DataTypes.ENUM('ABHA', 'PM_JAY'), 
    allowNull: true,
    comment: 'Type of identity card: ABHA (14 digits) or PM JAY (9 digits)'
  },
  ayushman_card_number: { 
    type: DataTypes.STRING(20), 
    allowNull: true,
    comment: 'Stores ABHA Number (14 digits) or PM JAY ID (9 digits) based on identity_card_type'
  },
  aadhar_card_number: { type: DataTypes.STRING(12), allowNull: true },
  pan_card_number: { type: DataTypes.STRING(10), allowNull: true },
  medical_condition: { type: DataTypes.TEXT, allowNull: false },
  hospital_id: { type: DataTypes.BIGINT, allowNull: false },
  source_hospital_id: { type: DataTypes.BIGINT, allowNull: false },
  district_id: { type: DataTypes.BIGINT, allowNull: false },
  contact_name: { type: DataTypes.STRING(100), allowNull: false },
  contact_phone: { type: DataTypes.STRING(10), allowNull: false },
  contact_email: { type: DataTypes.STRING(100), allowNull: false },
  submitted_by_user_id: { type: DataTypes.BIGINT, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      'PENDING','FORWARDED','APPROVED','REJECTED',
      'ESCALATED','IN_PROGRESS','COMPLETED','COLLECTOR_APPROVED','DME_APPROVED'
    ),
    defaultValue: 'PENDING'
  },
  // Collector approval tracking (for Out of Division two-step flow)
  collector_approved_by: { type: DataTypes.BIGINT, allowNull: true },
  collector_approved_at: { type: DataTypes.DATE, allowNull: true },
  collector_name: { type: DataTypes.STRING(150), allowNull: true },
  dme_approved_by: { type: DataTypes.BIGINT, allowNull: true },
  dme_approved_at: { type: DataTypes.DATE, allowNull: true },
  dme_name: { type: DataTypes.STRING(150), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  father_spouse_name: { type: DataTypes.STRING(100), allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.ENUM('Male','Female','Other'), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  chief_complaint: { type: DataTypes.TEXT, allowNull: true },
  general_condition: { type: DataTypes.STRING(50), allowNull: true },
  vitals: { type: DataTypes.ENUM('Stable','Unstable'), allowNull: false },
  referring_physician_name: { type: DataTypes.STRING(100), allowNull: true },
  referring_physician_designation: { type: DataTypes.STRING(100), allowNull: true },
  referral_note: { type: DataTypes.TEXT, allowNull: true },
  transportation_category: {
    type: DataTypes.ENUM(
      'Within Division','Out of Division','Out of State'
    ),
    allowNull: true
  },
  air_transport_type: { type: DataTypes.ENUM('Free','Paid'), allowNull: false },
  recommending_authority_name: { type: DataTypes.STRING(100), allowNull: true },
  recommending_authority_designation: { type: DataTypes.STRING(100), allowNull: true },
  approval_authority_name: { type: DataTypes.STRING(100), allowNull: true },
  approval_authority_designation: { type: DataTypes.STRING(100), allowNull: true },
  bed_availability_confirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  als_ambulance_arranged: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ambulance_registration_number: { type: DataTypes.STRING(50), allowNull: true },
  ambulance_contact: { type: DataTypes.STRING(15), allowNull: true },
  medical_team_note: { type: DataTypes.TEXT, allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true },

  // Hindi translations of free-text fields (auto-populated via Google Translate)
  patient_name_hi: { type: DataTypes.STRING(200), allowNull: true },
  father_spouse_name_hi: { type: DataTypes.STRING(200), allowNull: true },
  address_hi: { type: DataTypes.TEXT, allowNull: true },
  medical_condition_hi: { type: DataTypes.TEXT, allowNull: true },
  chief_complaint_hi: { type: DataTypes.TEXT, allowNull: true },
  general_condition_hi: { type: DataTypes.STRING(100), allowNull: true },
  referral_note_hi: { type: DataTypes.TEXT, allowNull: true },
  recommending_authority_name_hi: { type: DataTypes.STRING(200), allowNull: true },
  recommending_authority_designation_hi: { type: DataTypes.STRING(200), allowNull: true },
  approval_authority_name_hi: { type: DataTypes.STRING(200), allowNull: true },
  approval_authority_designation_hi: { type: DataTypes.STRING(200), allowNull: true },
  referring_physician_name_hi: { type: DataTypes.STRING(200), allowNull: true },
  referring_physician_designation_hi: { type: DataTypes.STRING(200), allowNull: true },
  medical_team_note_hi: { type: DataTypes.TEXT, allowNull: true },
  remarks_hi: { type: DataTypes.TEXT, allowNull: true },
  contact_name_hi: { type: DataTypes.STRING(200), allowNull: true }
}, {
  tableName: 'enquiries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // model-level validation of identity fields
  validate: {
    checkIdentityFields() {
      // Skip validation during updates if identity fields are not being changed
      if (this.isNewRecord || this.changed('identity_card_type') || this.changed('ayushman_card_number') || this.changed('aadhar_card_number') || this.changed('pan_card_number')) {

        // PAID SEVA — only Aadhaar required, skip Ayushman card entirely
        if (this.air_transport_type === 'Paid') {
          if (!this.aadhar_card_number) {
            throw new Error('Aadhar card number is required for Paid Seva');
          }
          if (!/^\d{12}$/.test(this.aadhar_card_number)) {
            throw new Error('Aadhar card number must be exactly 12 digits');
          }
          return; // skip rest of identity validation
        }

        if (this.identity_card_type) {
          // ABHA or PM JAY selected - validate accordingly
          if (this.identity_card_type === 'ABHA') {
            if (!this.ayushman_card_number) {
              throw new Error('ABHA Number is required when ABHA identity type is selected');
            }
            if (!/^\d{14}$/.test(this.ayushman_card_number)) {
              throw new Error('ABHA Number must be exactly 14 digits');
            }
          } else if (this.identity_card_type === 'PM_JAY') {
            if (!this.ayushman_card_number) {
              throw new Error('PM JAY ID is required when PM JAY identity type is selected');
            }
            if (!/^\d{9}$/.test(this.ayushman_card_number)) {
              throw new Error('PM JAY ID must be exactly 9 digits');
            }
          }
        } else {
          // No identity card type selected — Aadhar is optional but if provided must be 12 digits
          if (this.aadhar_card_number && !/^\d{12}$/.test(this.aadhar_card_number)) {
            throw new Error('Aadhar card number must be exactly 12 digits');
          }
          // PAN if provided must match format
          if (this.pan_card_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(this.pan_card_number)) {
            throw new Error('PAN card number must follow format ABCDE1234F');
          }
        }
      }
    }
  },

  hooks: {
    // ensure enquiry_code exists before validation
    beforeValidate: enquiry => {
      if (!enquiry.enquiry_code) {
        enquiry.enquiry_code = `TMP${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`;
      }
    },
    // once we have the ID + district, generate the final city-prefixed code
    afterCreate: async (enquiry, options) => {
      try {
        const District = require('./District');
        const district = await District.findByPk(enquiry.district_id, { attributes: ['district_name'] });
        // Build 3-letter prefix from district name e.g. "Bhopal" → "BHO"
        const raw = (district?.district_name || 'ENQ').replace(/\s+/g, '');
        const prefix = raw.substring(0, 3).toUpperCase();
        const code = `${prefix}-${enquiry.enquiry_id.toString().padStart(10, '0')}`;
        await enquiry.update({ enquiry_code: code }, { hooks: false });
      } catch {
        // fallback to old format if district lookup fails
        const code = `ENQ-${enquiry.enquiry_id.toString().padStart(10, '0')}`;
        await enquiry.update({ enquiry_code: code }, { hooks: false });
      }
    }
  }
});

// associations
Enquiry.associate = models => {
  Enquiry.belongsTo(models.User, { foreignKey: 'submitted_by_user_id', as: 'submittedBy' });
  Enquiry.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
  Enquiry.belongsTo(models.Hospital, { foreignKey: 'source_hospital_id', as: 'sourceHospital' });
  Enquiry.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
  Enquiry.hasMany(models.Document, { foreignKey: 'enquiry_id', as: 'documents' });
  Enquiry.hasMany(models.CaseEscalation, { foreignKey: 'enquiry_id', as: 'escalations' });
};

module.exports = Enquiry;
