/**
 * Production DB Fix Script
 * Makes Paid-seva optional columns nullable
 * Run: node scripts/fix_production_db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const FIX_SQL = `
  ALTER TABLE enquiries
    MODIFY COLUMN chief_complaint TEXT NULL,
    MODIFY COLUMN chief_complaint_hi TEXT NULL,
    MODIFY COLUMN general_condition VARCHAR(50) NULL,
    MODIFY COLUMN general_condition_hi VARCHAR(100) NULL,
    MODIFY COLUMN referring_physician_name VARCHAR(100) NULL,
    MODIFY COLUMN referring_physician_designation VARCHAR(100) NULL,
    MODIFY COLUMN transportation_category ENUM('Within Division','Out of Division','Out of State') NULL,
    MODIFY COLUMN recommending_authority_name VARCHAR(100) NULL,
    MODIFY COLUMN recommending_authority_designation VARCHAR(100) NULL,
    MODIFY COLUMN approval_authority_name VARCHAR(100) NULL,
    MODIFY COLUMN approval_authority_designation VARCHAR(100) NULL,
    MODIFY COLUMN ambulance_registration_number VARCHAR(50) NULL,
    MODIFY COLUMN ambulance_contact VARCHAR(15) NULL
`;

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log(`\n✅ Connected to DB: ${config.database} @ ${config.host}\n`);

    console.log('⏳ Applying ALTER TABLE fix...\n');
    await conn.query(FIX_SQL);
    console.log('✅ ALTER TABLE applied successfully!\n');

    // Verify
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'enquiries'
      AND COLUMN_NAME IN (
        'chief_complaint', 'general_condition', 'referring_physician_name',
        'transportation_category', 'recommending_authority_name',
        'approval_authority_name', 'ambulance_contact'
      )
      ORDER BY ORDINAL_POSITION
    `, [config.database]);

    console.log('🔍 Verification:');
    let allGood = true;
    cols.forEach(c => {
      const ok = c.IS_NULLABLE === 'YES';
      if (!ok) allGood = false;
      console.log(`  ${c.COLUMN_NAME.padEnd(40)} ${ok ? '✅ NULL allowed' : '❌ STILL NOT NULL'}`);
    });

    console.log(allGood
      ? '\n🎉 All columns fixed! Paid enquiry creation should work now.\n'
      : '\n⚠️  Some columns still NOT NULL — check DB user permissions.\n'
    );

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

run();
