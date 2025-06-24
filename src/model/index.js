const sequelize = require('../config/database');
const District = require('./District');
const Hospital = require('./Hospital');
const Enquiry = require('./Enquiry');
const Document = require('./Document');
const User = require('./User');

const models = {
  District,
  Hospital,
  Enquiry,
  Document,
  User,
};

// Define associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, ...models };