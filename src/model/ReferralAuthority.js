const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReferralAuthority = sequelize.define('ReferralAuthority', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  designation: { type: DataTypes.STRING(150), allowNull: false },
  type: {
    // PHYSICIAN = referring doctor, RECOMMENDING = recommending authority, APPROVAL = approval authority
    type: DataTypes.ENUM('PHYSICIAN', 'RECOMMENDING', 'APPROVAL'),
    allowNull: false,
  },
  hospital_id: { type: DataTypes.BIGINT, allowNull: true },
  district_id: { type: DataTypes.BIGINT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'referral_authorities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

ReferralAuthority.associate = (models) => {
  ReferralAuthority.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
  ReferralAuthority.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
};

module.exports = ReferralAuthority;
