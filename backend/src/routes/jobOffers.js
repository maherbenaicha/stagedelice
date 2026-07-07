const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobOfferController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.getOffers);
router.post('/generate', ctrl.generateOffer);
router.post('/', ctrl.createOffer);
router.get('/:id', ctrl.getOffer);
router.put('/:id', ctrl.updateOffer);
router.put('/:id/pipeline', ctrl.updatePipeline);
router.post('/:id/pipeline/regenerate', ctrl.regeneratePipeline);

module.exports = router;
