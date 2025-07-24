const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FlightAssignment = sequelize.define('FlightAssignment', {
  assignment_id: {
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
  ambulance_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  crew_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  departure_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  arrival_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'ASSIGNED',
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
  tableName: 'flight_assignments',
  timestamps: false,
  comment: 'Stores air ambulance assignments'
});

module.exports = FlightAssignment;