const db = require('../config/db');

const getPeriodBounds = (month, year) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(yearNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    yearNumber < 2000 ||
    yearNumber > 2100
  ) {
    return null;
  }

  const start = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-01`;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? yearNumber + 1 : yearNumber;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  return { monthNumber, yearNumber, start, end };
};

exports.getMonthlyReport = async (req, res) => {
  const period = getPeriodBounds(req.query.month, req.query.year);

  if (!period) {
    return res.status(400).json({ message: 'Muaji ose viti nuk eshte valid' });
  }

  try {
    const userId = req.user.id;

    const [[totalRow], [categoryRows], [dailyRows], [expenseRows], [budgetRows]] =
      await Promise.all([
        db.query(
          `SELECT COALESCE(SUM(amount), 0) AS total
           FROM expenses
           WHERE user_id = ? AND expense_date >= ? AND expense_date < ?`,
          [userId, period.start, period.end]
        ),
        db.query(
          `SELECT c.id AS categoryId,
                  COALESCE(c.name, 'Pa kategori') AS category,
                  COALESCE(c.color, '#2E75B6') AS color,
                  COUNT(e.id) AS count,
                  COALESCE(SUM(e.amount), 0) AS total
           FROM expenses e
           LEFT JOIN categories c ON c.id = e.category_id
           WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date < ?
           GROUP BY c.id, c.name, c.color
           ORDER BY total DESC`,
          [userId, period.start, period.end]
        ),
        db.query(
          `SELECT DAY(expense_date) AS day, COALESCE(SUM(amount), 0) AS total
           FROM expenses
           WHERE user_id = ? AND expense_date >= ? AND expense_date < ?
           GROUP BY DAY(expense_date)
           ORDER BY day ASC`,
          [userId, period.start, period.end]
        ),
        db.query(
          `SELECT e.id,
                  DATE_FORMAT(e.expense_date, '%Y-%m-%d') AS date,
                  COALESCE(c.name, 'Pa kategori') AS category,
                  e.amount,
                  e.note
           FROM expenses e
           LEFT JOIN categories c ON c.id = e.category_id
           WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date < ?
           ORDER BY e.expense_date ASC, e.id ASC`,
          [userId, period.start, period.end]
        ),
        db.query(
          `SELECT amount
           FROM budgets
           WHERE user_id = ? AND month = ? AND year = ?
           LIMIT 1`,
          [userId, period.monthNumber, period.yearNumber]
        ),
      ]);

    res.json({
      month: period.monthNumber,
      year: period.yearNumber,
      total: Number(totalRow[0]?.total || 0),
      categories: categoryRows.map((row) => ({
        categoryId: row.categoryId,
        category: row.category,
        color: row.color,
        count: Number(row.count || 0),
        total: Number(row.total || 0),
      })),
      daily: dailyRows.map((row) => ({
        day: Number(row.day),
        total: Number(row.total || 0),
      })),
      expenses: expenseRows.map((row) => ({
        id: row.id,
        date: row.date,
        category: row.category,
        amount: Number(row.amount || 0),
        note: row.note || '',
      })),
      budget: budgetRows.length ? Number(budgetRows[0].amount || 0) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjate marrjes se raportit' });
  }
};

exports.upsertMonthlyBudget = async (req, res) => {
  const period = getPeriodBounds(req.body.month, req.body.year);
  const amount = Number(req.body.amount);

  if (!period || Number.isNaN(amount) || amount < 0) {
    return res.status(400).json({ message: 'Te dhenat e buxhetit nuk jane valide' });
  }

  try {
    await db.query(
      `INSERT INTO budgets (user_id, amount, month, year)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [req.user.id, amount, period.monthNumber, period.yearNumber]
    );

    res.json({
      month: period.monthNumber,
      year: period.yearNumber,
      amount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjate ruajtjes se buxhetit' });
  }
};
