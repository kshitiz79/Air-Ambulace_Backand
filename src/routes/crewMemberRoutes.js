const express = require('express');
const router = express.Router();
const crewMemberController = require('../controller/crewMemberController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/', crewMemberController.getAllCrewMembers);
router.get('/:id', crewMemberController.getCrewMemberById);
router.post('/', crewMemberController.createCrewMember);
router.put('/:id', crewMemberController.updateCrewMember);
router.delete('/:id', crewMemberController.deleteCrewMember);

module.exports = router;
