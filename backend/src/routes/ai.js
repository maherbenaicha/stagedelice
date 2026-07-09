const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.post('/generate-questions', ctrl.generate);
router.post('/chat', ctrl.chat);

module.exports = router;