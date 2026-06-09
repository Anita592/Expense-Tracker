const db = require('../config/db');

const normalizeDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
};

const getOrCreateCategory = async (userId, categoryValue) => {
  const trimmedValue = String(categoryValue || '').trim();

  if (!trimmedValue) return null;

  if (/^\d+$/.test(trimmedValue)) {
    const [rows] = await db.query(
      'SELECT id, name, color FROM categories WHERE id = ? AND user_id = ?',
      [Number(trimmedValue), userId]
    );
    return rows[0] || null;
  }

  const [existing] = await db.query(
    'SELECT id, name, color FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [userId, trimmedValue]
  );

  if (existing.length) return existing[0];

  const [result] = await db.query(
    'INSERT INTO categories (user_id, name) VALUES (?, ?)',
    [userId, trimmedValue]
  );

  return { id: result.insertId, name: trimmedValue, color: '#2E75B6' };
};

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, color
       FROM categories
       WHERE user_id = ?
       ORDER BY name ASC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get categories error:', err.message);
    res.status(500).json({ message: 'Gabim gjate marrjes se kategorive' });
  }
};

exports.getExpenses = async (req, res) => {
  const { categoryId, month, date } = req.query;
  const params = [req.user.id];
  const where = ['e.user_id = ?'];

  if (categoryId) {
    where.push('e.category_id = ?');
    params.push(Number(categoryId));
  }

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.push('DATE_FORMAT(e.expense_date, "%Y-%m") = ?');
    params.push(month);
  }

  if (date && normalizeDate(date)) {
    where.push('e.expense_date = ?');
    params.push(date);
  }

  try {
    const [rows] = await db.query(
      `SELECT e.id,
              e.amount,
              e.note,
              DATE_FORMAT(e.expense_date, '%Y-%m-%d') AS expense_date,
              e.category_id,
              c.name AS category,
              c.color AS category_color
       FROM expenses e
       INNER JOIN categories c ON c.id = e.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY e.expense_date DESC, e.id DESC`,
      params
    );

    const expenses = rows.map((row) => ({
      id: row.id,
      amount: Number(row.amount || 0),
      note: row.note || '',
      expense_date: row.expense_date,
      category_id: row.category_id,
      category: row.category,
      category_color: row.category_color,
    }));

    res.json({
      expenses,
      total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    });
  } catch (err) {
    console.error('Get expenses error:', err.message);
    res.status(500).json({ message: 'Gabim gjate marrjes se shpenzimeve' });
  }
};

exports.createExpense = async (req, res) => {
  const amount = Number(req.body.amount);
  const expenseDate = normalizeDate(req.body.expense_date || req.body.date);
  const note = req.body.note || req.body.description || '';
  const category = req.body.category_id || req.body.category;

  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Shuma duhet te jete me e madhe se 0' });
  }

  if (!expenseDate) {
    return res.status(400).json({ message: 'Data e shpenzimit nuk eshte valide' });
  }

  try {
    const categoryRow = await getOrCreateCategory(req.user.id, category);

    if (!categoryRow) {
      return res.status(400).json({ message: 'Kategoria eshte e detyrueshme' });
    }

    const [result] = await db.query(
      `INSERT INTO expenses (user_id, category_id, amount, note, expense_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, categoryRow.id, amount, note, expenseDate]
    );

    res.status(201).json({
      message: 'Shpenzimi u shtua me sukses',
      expense: {
        id: result.insertId,
        amount,
        note,
        expense_date: expenseDate,
        category_id: categoryRow.id,
        category: categoryRow.name,
        category_color: categoryRow.color,
      },
    });
  } catch (err) {
    console.error('Create expense error:', err.message);
    res.status(500).json({ message: err.sqlMessage || 'Gabim gjate shtimit te shpenzimit' });
  }
};

exports.updateExpense = async (req, res) => {
  const amount = Number(req.body.amount);
  const expenseDate = normalizeDate(req.body.expense_date || req.body.date);
  const note = req.body.note || req.body.description || '';
  const category = req.body.category_id || req.body.category;

  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Shuma duhet te jete me e madhe se 0' });
  }

  if (!expenseDate) {
    return res.status(400).json({ message: 'Data e shpenzimit nuk eshte valide' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Shpenzimi nuk u gjet' });
    }

    const categoryRow = await getOrCreateCategory(req.user.id, category);

    if (!categoryRow) {
      return res.status(400).json({ message: 'Kategoria eshte e detyrueshme' });
    }

    await db.query(
      `UPDATE expenses
       SET category_id = ?, amount = ?, note = ?, expense_date = ?
       WHERE id = ? AND user_id = ?`,
      [categoryRow.id, amount, note, expenseDate, req.params.id, req.user.id]
    );

    res.json({
      message: 'Shpenzimi u perditesua me sukses',
      expense: {
        id: Number(req.params.id),
        amount,
        note,
        expense_date: expenseDate,
        category_id: categoryRow.id,
        category: categoryRow.name,
        category_color: categoryRow.color,
      },
    });
  } catch (err) {
    console.error('Update expense error:', err.message);
    res.status(500).json({ message: err.sqlMessage || 'Gabim gjate perditesimit te shpenzimit' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Shpenzimi nuk u gjet' });
    }

    res.json({ message: 'Shpenzimi u fshi me sukses' });
  } catch (err) {
    console.error('Delete expense error:', err.message);
    res.status(500).json({ message: 'Gabim gjate fshirjes se shpenzimit' });
  }
};
