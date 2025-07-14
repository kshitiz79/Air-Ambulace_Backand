// model/CaseQuery.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseQuery = sequelize.define('CaseQuery', {
  query_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  enquiry_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  raised_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  query_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  response_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  responded_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },

  query_code: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
    field: 'query_code',
  
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'case_queries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,

  hooks: {
    // before validation, assign a placeholder code so "not null" and regex checks pass
    beforeValidate: (cq) => {
      if (!cq.query_code) {
        cq.query_code = `QRY${Math.floor(Math.random() * 1e10)
          .toString()
          .padStart(10, '0')}`;
      }
    },
    // after insert, overwrite with zero-padded ID code
    afterCreate: async (cq) => {
      const finalCode = `QRY${cq.query_id.toString().padStart(10, '0')}`;
      await cq.update({ query_code: finalCode }, { hooks: false });
    },
  }
});

CaseQuery.associate = models => {
  CaseQuery.belongsTo(models.Enquiry, { foreignKey: 'enquiry_id', as: 'enquiry' });
  CaseQuery.belongsTo(models.User, { foreignKey: 'raised_by_user_id', as: 'raisedBy' });
  CaseQuery.belongsTo(models.User, { foreignKey: 'responded_by_user_id', as: 'respondedBy' });
};

module.exports = CaseQuery;
