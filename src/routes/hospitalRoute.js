const express = require('express');
const router = express.Router();
const hospitalController = require('../controller/hospitalController');

router.get('/', hospitalController.getAllHospitals);
router.post('/', hospitalController.createHospital);

module.exports = router;