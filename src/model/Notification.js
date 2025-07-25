const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('SMS', 'EMAIL', 'IN_APP'),
    allowNull: false,
    defaultValue: 'IN_APP'
  },
  status: {
    type: DataTypes.ENUM('SENT', 'PENDING', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  enquiry_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'enquiries',
      key: 'enquiry_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  comment: 'Stores notifications for users'
});

// Associations
Notification.associate = models => {
  Notification.belongsTo(models.User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });
  Notification.belongsTo(models.Enquiry, { 
    foreignKey: 'enquiry_id', 
    as: 'enquiry' 
  });
};

module.exports = Notification;