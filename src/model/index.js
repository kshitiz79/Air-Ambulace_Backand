const sequelize = require('../config/database');
const District = require('./District');
const Hospital = require('./Hospital');
const Enquiry = require('./Enquiry');
const Document = require('./Document');
const User = require('./User');
const CaseQuery = require('./CaseQuery');
const CaseEscalation = require('./CaseEscalation');
const FlightAssignment = require('./FlightAssignment');
const Ambulance = require('./Ambulance');

const models = {
  District,
  Hospital,
  Enquiry,
  Document,
  User,
  CaseQuery,
  CaseEscalation,
  FlightAssignment,
  Ambulance,
};

// Define associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, ...models };