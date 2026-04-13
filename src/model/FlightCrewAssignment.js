
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FlightCrewAssignment = sequelize.define('FlightCrewAssignment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  assignment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'flight_assignments',
      key: 'assignment_id'
    }
  },
  crew_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'crew_members',
      key: 'crew_id'
    }
  }
}, {
  tableName: 'flight_crew_assignments',
  timestamps: false,
});

module.exports = FlightCrewAssignment;
