const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  document_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  enquiry_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  document_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  file_path: {
    type: DataTypes.TEXT, // Changed from STRING(255) to TEXT to support long cloud URLs
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Document.associate = (models) => {
  Document.belongsTo(models.Enquiry, { foreignKey: 'enquiry_id', as: 'enquiry' });
};

module.exports = Document;
