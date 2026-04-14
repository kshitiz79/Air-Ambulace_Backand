
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CrewMember = sequelize.define('CrewMember', {
  crew_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('PILOT', 'DOCTOR', 'NURSE', 'PARAMEDIC', 'OTHER'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'ON_FLIGHT', 'OFF_DUTY'),
    defaultValue: 'AVAILABLE',
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
  tableName: 'crew_members',
  timestamps: false,
});

CrewMember.associate = models => {
  CrewMember.belongsToMany(models.FlightAssignment, {
    through: models.FlightCrewAssignment,
    foreignKey: 'crew_id',
    otherKey: 'assignment_id',
    as: 'assignments'
  });
};

module.exports = CrewMember;
