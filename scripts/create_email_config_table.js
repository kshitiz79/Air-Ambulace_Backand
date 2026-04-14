/**
 * Creates the email_config table in production DB
 * Run: node scripts/create_email_config_table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await conn.query(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INT PRIMARY KEY AUTO_INCREMENT,
      extra_emails TEXT NULL COMMENT 'Comma-separated extra emails to notify on enquiry creation',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      updated_by BIGINT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ email_config table created (or already exists)');
  await conn.end();
}
run().catch(console.error);
