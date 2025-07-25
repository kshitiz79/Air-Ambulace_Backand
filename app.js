const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sequelize = require("./src/config/database");

dotenv.config();
const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cors({
  origin: [
    'https://airambulance.jetserveaviation.com',
    'http://localhost:5173',
    'https://www.jetserveaviation.com'
  ],
  credentials: true
}));

// Routes
const hospitalRoutes = require('./src/routes/hospitalRoute');
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const districtRoutes = require("./src/routes/districtRoutes");
const caseQueryRoutes = require('./src/routes/caseQueryRoutes');
const enquiryRoutes = require('./src/routes/enquiryRoute');
const caseEscalationRoutes = require('./src/routes/caseEscalationRoutes');
const flightAssignmentRoutes = require('./src/routes/flightAssignmentRoutes');
const postOperationRoutes = require('./src/routes/postOperationRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const caseClosureRoutes = require('./src/routes/caseClosureRoutes');
const ambulanceRoutes = require('./src/routes/ambulanceRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

app.use('/api/enquiries', enquiryRoutes);
app.use('/api/case-escalations', caseEscalationRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/case-queries', caseQueryRoutes);
app.use('/api/flight-assignments', flightAssignmentRoutes);
app.use('/api/post-operation-reports', postOperationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/case-closures', caseClosureRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Air Ambulance Backend API!");
});

// Start server
app.listen(4000, async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    console.log("Server running on port 4000");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});