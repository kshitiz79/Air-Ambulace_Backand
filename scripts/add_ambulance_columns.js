/**
 * Adds return_available_at column and updates status ENUM on ambulances table
 * Run: node scripts/add_ambulance_columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });

  // Add return_available_at column
  await conn.query(`
    ALTER TABLE ambulances
    ADD COLUMN IF NOT EXISTS return_available_at DATETIME NULL
      COMMENT 'Scheduled time when RETURNING ambulance becomes AVAILABLE (next day 12:00 IST)'
  `).catch(() => {
    // MySQL < 8 doesn't support IF NOT EXISTS on ADD COLUMN
    return conn.query(`
      ALTER TABLE ambulances ADD COLUMN return_available_at DATETIME NULL
        COMMENT 'Scheduled time when RETURNING ambulance becomes AVAILABLE'
    `).catch(e => { if (!e.message.includes('Duplicate column')) throw e; });
  });

  // Update status ENUM to include RETURNING
  await conn.query(`
    ALTER TABLE ambulances
    MODIFY COLUMN status ENUM('AVAILABLE','IN_USE','RETURNING','MAINTENANCE','OUT_OF_SERVICE')
    NOT NULL DEFAULT 'AVAILABLE'
  `);

  console.log('✅ ambulances table updated: return_available_at added, RETURNING status added');
  await conn.end();
}
run().catch(console.error);
