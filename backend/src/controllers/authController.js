const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Emri, email dhe fjalëkalimi janë të detyrueshme' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Check backend/.env');
    return res.status(500).json({ message: 'Konfigurimi i JWT mungon në server' });
  }

  try {
    const [exists] = await db.query(
      'SELECT id FROM users WHERE email=?', [email]
    );
    if (exists.length)
      return res.status(400).json({ message: 'Email ekziston' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?,?,?)',
      [name, email, hash]
    );
    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.status(201).json({
      token,
      user: { id: result.insertId, name, email },
      userId: result.insertId,
    });
  } catch (err) {
    console.error('Register error:', {
      code: err.code,
      errno: err.errno,
      message: err.message,
    });
    res.status(500).json({ message: err.sqlMessage || err.message || 'Gabim serveri' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dhe fjalëkalimi janë të detyrueshme' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Check backend/.env');
    return res.status(500).json({ message: 'Konfigurimi i JWT mungon në server' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email=?', [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: 'Kredenciale gabim' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid)
      return res.status(401).json({ message: 'Kredenciale gabim' });

    const token = jwt.sign(
      { id: rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
  } catch (err) {
    console.error('Login error:', {
      code: err.code,
      errno: err.errno,
      message: err.message,
    });
    res.status(500).json({ message: err.sqlMessage || err.message || 'Gabim serveri' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email-i është i detyrueshëm' });
  }

  try {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Nuk u gjet llogari me këtë email' });
    }
    res.json({ message: 'Udhëzimet e rivendosjes u dërguan në email' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim serveri' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ message: 'Logout i suksesshëm' });
};
