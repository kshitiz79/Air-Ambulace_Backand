const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Hospital = sequelize.define("Hospital", {
  hospital_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  hospital_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  hospital_type: {
    type: DataTypes.ENUM('GOVERNMENT', 'PRIVATE'),
    allowNull: false,
    defaultValue: 'PRIVATE'
  },
  contact_person_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contact_person_phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  contact_person_email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: "hospitals",
  timestamps: false
});

Hospital.associate = (models) => {
  Hospital.belongsTo(models.District, {
    foreignKey: 'district_id',
    as: 'district'
  });
};

module.exports = Hospital;