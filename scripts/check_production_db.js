/**
 * Production DB Diagnostic Script
 * Checks chief_complaint and related column constraints in the live DB
 * Run: node scripts/check_production_db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log(`\n✅ Connected to DB: ${config.database} @ ${config.host}\n`);

    // 1. Check actual column definitions for chief_complaint and related fields
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  COLUMN DEFINITIONS (enquiries table)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'enquiries'
      AND COLUMN_NAME IN (
        'chief_complaint', 'chief_complaint_hi',
        'general_condition', 'vitals',
        'referring_physician_name', 'transportation_category',
        'air_transport_type', 'medical_condition'
      )
      ORDER BY ORDINAL_POSITION
    `, [config.database]);

    cols.forEach(c => {
      const nullable = c.IS_NULLABLE === 'YES' ? '✅ NULL allowed' : '❌ NOT NULL';
      console.log(`  ${c.COLUMN_NAME.padEnd(40)} ${nullable}  default=${c.COLUMN_DEFAULT ?? 'none'}`);
    });

    // 2. Try inserting a minimal Paid enquiry with chief_complaint = NULL
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  TEST: INSERT Paid enquiry with chief_complaint = NULL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get a valid hospital_id, source_hospital_id, district_id, user_id to satisfy FK
    const [[hospital]] = await conn.query(`SELECT hospital_id FROM hospitals LIMIT 1`);
    const [[district]] = await conn.query(`SELECT district_id FROM districts LIMIT 1`);
    const [[user]] = await conn.query(`SELECT user_id FROM users LIMIT 1`);

    if (!hospital || !district || !user) {
      console.log('⚠️  Cannot run insert test — no hospitals/districts/users found in DB');
    } else {
      try {
        await conn.beginTransaction();

        const [result] = await conn.query(`
          INSERT INTO enquiries (
            enquiry_code, patient_name, medical_condition,
            hospital_id, source_hospital_id, district_id,
            contact_name, contact_phone, contact_email,
            submitted_by_user_id, father_spouse_name, age, gender,
            address, vitals, air_transport_type,
            chief_complaint, general_condition,
            bed_availability_confirmed, als_ambulance_arranged
          ) VALUES (
            'TEST-PAID-001', 'Test Patient', 'Test Condition',
            ?, ?, ?,
            'Test Contact', '9876543210', 'test@test.com',
            ?, 'Test Father', 30, 'Male',
            'Test Address', 'Stable', 'Paid',
            NULL, NULL,
            0, 0
          )
        `, [hospital.hospital_id, hospital.hospital_id, district.district_id, user.user_id]);

        console.log(`  ✅ INSERT succeeded — row id: ${result.insertId}`);
        console.log('  ✅ chief_complaint = NULL is ALLOWED in production DB');

        // Rollback so we don't pollute real data
        await conn.rollback();
        console.log('  🔄 Rolled back test insert (no real data changed)');
      } catch (insertErr) {
        await conn.rollback();
        console.log(`  ❌ INSERT FAILED: ${insertErr.message}`);
        console.log('\n  👉 ROOT CAUSE FOUND: Production DB has chief_complaint as NOT NULL');
        console.log('  👉 FIX: Run the ALTER TABLE statement below\n');
      }
    }

    // 3. Show the fix SQL
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  FIX SQL (run this on production if test above failed)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
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
    MODIFY COLUMN ambulance_contact VARCHAR(15) NULL;
`);

  } catch (err) {
    console.error('❌ Connection/query error:', err.message);
  } finally {
    if (conn) await conn.end();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

run();
