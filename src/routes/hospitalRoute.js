const express = require('express');
const router = express.Router();
const hospitalController = require('../controller/hospitalController');

router.get('/', hospitalController.getAllHospitals);
router.post('/', hospitalController.createHospital);
router.post('/bulk', hospitalController.bulkCreateHospitals);

module.exports = router;