const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

exports.login = async (req, res) => {
  try {
    // Minimal debug log (avoid logging sensitive fields)
    const { email, password } = req.body;
    console.log('POST /api/auth/login - incoming', { ip: req.ip, email });
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email AND is_active = 1');
    
    const user = result.recordset[0];
    console.log('DB lookup for login:', user ? { id: user.id, email: user.email, role: user.role, is_active: user.is_active } : null);
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Identifiants incorrects' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.full_name } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id, email, full_name, role, created_at FROM Users WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT * FROM Users WHERE id = @id');
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('password_hash', sql.VarChar, newHash)
      .query('UPDATE Users SET password_hash=@password_hash WHERE id=@id');

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
