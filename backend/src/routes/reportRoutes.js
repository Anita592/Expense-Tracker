const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/dashboard', authMiddleware, reportController.getDashboard);
router.get('/monthly', authMiddleware, reportController.getMonthlyReport);
router.put('/budget', authMiddleware, reportController.upsertMonthlyBudget);

module.exports = router;
