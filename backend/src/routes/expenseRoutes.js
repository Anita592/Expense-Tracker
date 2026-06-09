const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.get('/categories', authMiddleware, expenseController.getCategories);
router.get('/', authMiddleware, expenseController.getExpenses);
router.post('/', authMiddleware, expenseController.createExpense);
router.put('/:id', authMiddleware, expenseController.updateExpense);
router.patch('/:id', authMiddleware, expenseController.updateExpense);
router.delete('/:id', authMiddleware, expenseController.deleteExpense);

module.exports = router;
