const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/talentController');
const emailCtrl = require('../controllers/emailController');
const { authMiddleware } = require('../middleware/auth');
const { uploadCV } = require('../middleware/upload');

router.use(authMiddleware);

router.get('/dashboard', ctrl.getTalentDashboard);
router.get('/applications', ctrl.getApplications);
router.get('/applications/:id', ctrl.getApplication);
router.get('/offers/:offerId/ranking', ctrl.getRanking);
router.post('/offers/:offerId/cvs', uploadCV.array('cvs', 10), ctrl.uploadAndAnalyzeCVs);

router.get('/emails/templates', emailCtrl.getTemplates);
router.post('/emails/templates', emailCtrl.saveTemplate);
router.post('/emails/generate', emailCtrl.generateEmail);
router.get('/emails/logs', emailCtrl.getEmailLogs);

module.exports = router;
