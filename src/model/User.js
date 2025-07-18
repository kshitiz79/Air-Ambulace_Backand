const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM,
    values: ['BENEFICIARY', 'CMO', 'SDM', 'DM', 'SERVICE_PROVIDER', 'ADMIN', 'HOSPITAL', 'SUPPORT'],
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  district_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM,
    values: ['active', 'inactive', 'suspended'],
    defaultValue: 'active'
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
  tableName: 'users',
  timestamps: false
});

// Define associations
User.associate = (models) => {
  // Association with District
  User.belongsTo(models.District, {
    foreignKey: 'district_id',
    as: 'district'
  });
};

module.exports = User;
