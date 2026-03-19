const express = require('express');
const router = express.Router();
const ctrl = require('../controller/referralAuthorityController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getAll);
router.post('/', verifyToken, ctrl.create);
router.post('/bulk', verifyToken, ctrl.bulkCreate);
router.put('/:id', verifyToken, ctrl.update);
router.delete('/:id', verifyToken, ctrl.remove);

module.exports = router;
