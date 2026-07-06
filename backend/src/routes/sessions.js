const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sessionController');
const { authMiddleware } = require('../middleware/auth');

router.post('/start', ctrl.startSession);
router.post('/submit', ctrl.submitSession);
router.get('/', authMiddleware, ctrl.getSessions);
router.get('/:id', authMiddleware, ctrl.getSession);

module.exports = router;
