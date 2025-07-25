const express = require('express');
const router = express.Router();
const {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  getAvailableAmbulances,
  updateAmbulanceStatus,
  getAmbulanceStats,
  getAmbulancesByLocation
} = require('../controller/ambulanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllAmbulances);
router.get('/available', getAvailableAmbulances); // Key route for flight assignment
router.get('/stats', getAmbulanceStats);
router.get('/location/:location', getAmbulancesByLocation);
router.get('/:id', getAmbulanceById);
router.post('/', createAmbulance);
router.put('/:id', updateAmbulance);
router.patch('/:id/status', updateAmbulanceStatus);
router.delete('/:id', deleteAmbulance);

module.exports = router;