const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/testController');
const qCtrl = require('../controllers/questionController');
const { authMiddleware } = require('../middleware/auth');

router.get('/code/:code', ctrl.getTestByCode);
router.use(authMiddleware);
router.get('/', ctrl.getTests);
router.post('/', ctrl.createTest);
router.get('/:id', ctrl.getTest);
router.put('/:id', ctrl.updateTest);
router.delete('/:id', ctrl.deleteTest);
router.get('/:testId/questions', qCtrl.getQuestions);
router.post('/:testId/questions', qCtrl.createQuestion);
router.put('/:testId/questions/:id', qCtrl.updateQuestion);
router.delete('/:testId/questions/:id', qCtrl.deleteQuestion);

module.exports = router;
