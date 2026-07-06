const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Restricts a route to users with the 'admin' role only.
// User management (create/update/deactivate accounts) is an admin-only
// capability; HR recruiters manage tests and candidates but not accounts.
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
