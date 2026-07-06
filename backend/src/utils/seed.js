/**
 * seed.js
 * -----------------------------------------------------------------------
 * Convenience script that executes `init-db.sql` against the SQL Server
 * instance described by the environment variables (see .env.example).
 * It creates the database/tables if missing and inserts the default
 * admin/RH users plus one sample test.
 *
 * Usage:
 *   npm run seed
 * -----------------------------------------------------------------------
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

async function seed() {
  const scriptPath = path.join(__dirname, 'init-db.sql');
  const script = fs.readFileSync(scriptPath, 'utf8');

  // init-db.sql uses `GO` as a batch separator (SQL Server convention),
  // which the mssql driver does not understand natively, so we split
  // and execute each batch individually.
  const batches = script
    .split(/^\s*GO\s*$/im)
    .map((b) => b.trim())
    .filter(Boolean);

  const config = {
    server: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: { encrypt: false, trustServerCertificate: true },
  };

  console.log(`Connexion à SQL Server (${config.server})...`);
  const pool = await sql.connect(config);

  try {
    for (const batch of batches) {
      await pool.request().batch(batch);
    }
    console.log('✅ Base de données initialisée et données de démonstration insérées.');
    console.log('   Admin  : admin@stagedelice.com / Admin@123');
    console.log('   RH     : rh@stagedelice.com / Admin@123');
  } finally {
    await pool.close();
  }
}

seed().catch((err) => {
  console.error('❌ Échec du seed :', err.message);
  process.exit(1);
});
