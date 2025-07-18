const express = require('express');
const router = express.Router();
const escalationController = require('../controller/caseEscalationController');

// Get all escalations
router.get('/', escalationController.getAllEscalations);

// Get escalation by ID
router.get('/:id', escalationController.getEscalationById);

// Create new escalation
router.post('/', escalationController.createEscalation);

// Update escalation
router.put('/:id', escalationController.updateEscalation);

// Delete escalation
router.delete('/:id', escalationController.deleteEscalation);

// Resolve escalation
router.patch('/:id/resolve', escalationController.resolveEscalation);

module.exports = router;