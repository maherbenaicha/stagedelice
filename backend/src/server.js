require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS to accept the frontend origin(s).
// In development accept any localhost origin (flexible ports)
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return callback(null, true);
    } catch (e) {
      // fallthrough
    }
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/job-offers', require('./routes/jobOffers'));
app.use('/api/talent', require('./routes/talent'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
