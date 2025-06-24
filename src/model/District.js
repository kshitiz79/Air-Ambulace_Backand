const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const District = sequelize.define("District", {
  district_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  district_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  post_office_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(50),
    defaultValue: "Madhya Pradesh"
  }
}, {
  tableName: "districts",
  timestamps: false
});

module.exports = District;
