/**
 * Adds medical_summary_path and manifest_path to flight_assignments
 * Run: node scripts/add_flight_docs_columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  for (const col of ['medical_summary_path', 'manifest_path']) {
    await conn.query(`ALTER TABLE flight_assignments ADD COLUMN IF NOT EXISTS ${col} VARCHAR(500) NULL`)
      .catch(() => conn.query(`ALTER TABLE flight_assignments ADD COLUMN ${col} VARCHAR(500) NULL`)
        .catch(e => { if (!e.message.includes('Duplicate column')) throw e; }));
  }
  console.log('✅ flight_assignments: medical_summary_path and manifest_path added');
  await conn.end();
}
run().catch(console.error);
