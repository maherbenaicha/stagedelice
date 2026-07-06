const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/dashboard', ctrl.getDashboard);
router.get('/export/excel', ctrl.exportExcel);
router.get('/export/pdf', ctrl.exportPDF);

module.exports = router;
