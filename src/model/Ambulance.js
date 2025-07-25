const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ambulance = sequelize.define('Ambulance', {
  ambulance_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^AA-\d{3}$/ // Format: AA-001, AA-002, etc.
    }
  },
  aircraft_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'),
    defaultValue: 'AVAILABLE',
    allowNull: false
  },
  base_location: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ambulances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Stores air ambulance fleet information'
});

// Associations
Ambulance.associate = models => {
  Ambulance.hasMany(models.FlightAssignment, { 
    foreignKey: 'ambulance_id', 
    as: 'assignments' 
  });
};

module.exports = Ambulance;