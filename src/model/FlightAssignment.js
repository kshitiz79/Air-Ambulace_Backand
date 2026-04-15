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
    allowNull: false, // Make it required
    references: {
      model: 'ambulances',
      key: 'ambulance_id'
    },
    validate: {
      notEmpty: true
    }
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
  medical_summary_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to medical summary document uploaded on flight completion',
  },
  manifest_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to flight manifest document uploaded on flight completion',
  },
  route_stops: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of intermediate stops: [{stop_label, district, arrival_time, departure_time}]',
    get() {
      const raw = this.getDataValue('route_stops');
      try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    },
    set(val) {
      this.setDataValue('route_stops', val ? JSON.stringify(val) : null);
    },
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

// Associations
FlightAssignment.associate = models => {
  FlightAssignment.belongsTo(models.Enquiry, {
    foreignKey: 'enquiry_id',
    as: 'enquiry'
  });
  FlightAssignment.belongsTo(models.Ambulance, {
    foreignKey: 'ambulance_id',
    as: 'ambulance'
  });
  FlightAssignment.belongsToMany(models.CrewMember, {
    through: models.FlightCrewAssignment,
    foreignKey: 'assignment_id',
    otherKey: 'crew_id',
    as: 'crewMembers'
  });
};

module.exports = FlightAssignment;