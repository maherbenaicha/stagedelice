const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

exports.getUsers = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, email, full_name, role, is_active, created_at FROM Users ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const pool = await getPool();
    await pool.request()
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, hash)
      .input('full_name', sql.VarChar, full_name)
      .input('role', sql.VarChar, role || 'rh')
      .query('INSERT INTO Users (email, password_hash, full_name, role) VALUES (@email, @password_hash, @full_name, @role)');
    res.status(201).json({ message: 'Utilisateur créé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { full_name, role, is_active } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('full_name', sql.VarChar, full_name)
      .input('role', sql.VarChar, role)
      .input('is_active', sql.Bit, is_active)
      .query('UPDATE Users SET full_name=@full_name, role=@role, is_active=@is_active WHERE id=@id');
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Users SET is_active=0 WHERE id=@id');
    res.json({ message: 'Utilisateur désactivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
