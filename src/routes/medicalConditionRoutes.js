const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAll, create, update, remove } = require('../controller/medicalConditionController');

router.get('/', getAll);  // public — needed by enquiry form (no auth required for dropdown)
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
