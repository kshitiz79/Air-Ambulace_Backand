/**
 * Fix chk_identity_card_validation constraint
 * Run: node scripts/fix_identity_constraint.js
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

    // 1. Show existing CHECK constraints on enquiries table
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  EXISTING CHECK CONSTRAINTS on enquiries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const [constraints] = await conn.query(`
      SELECT CONSTRAINT_NAME, CHECK_CLAUSE
      FROM information_schema.CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = ?
      AND CONSTRAINT_NAME LIKE '%identity%'
    `, [config.database]);

    if (constraints.length === 0) {
      console.log('  No identity-related CHECK constraints found.\n');
    } else {
      constraints.forEach(c => {
        console.log(`  Name : ${c.CONSTRAINT_NAME}`);
        console.log(`  Clause: ${c.CHECK_CLAUSE}\n`);
      });
    }

    // 2. Drop the bad constraint
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  DROPPING chk_identity_card_validation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
      await conn.query(`ALTER TABLE enquiries DROP CHECK chk_identity_card_validation`);
      console.log('  ✅ Constraint dropped successfully!\n');
    } catch (e) {
      console.log(`  ⚠️  Drop failed (maybe already gone): ${e.message}\n`);
    }

    // 3. Add corrected constraint — Paid only needs aadhar, Free needs ayushman OR aadhar
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  ADDING corrected CHECK constraint');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
      await conn.query(`
        ALTER TABLE enquiries
        ADD CONSTRAINT chk_identity_card_validation CHECK (
          (
            air_transport_type = 'Paid'
            AND aadhar_card_number IS NOT NULL
          )
          OR
          (
            air_transport_type = 'Free'
            AND (
              ayushman_card_number IS NOT NULL
              OR aadhar_card_number IS NOT NULL
            )
          )
        )
      `);
      console.log('  ✅ New constraint added!\n');
    } catch (e) {
      console.log(`  ❌ Add constraint failed: ${e.message}\n`);
      console.log('  👉 Constraint NOT re-added — validation is handled by backend/Sequelize model.\n');
    }

    // 4. Verify with a test insert (Paid, no ayushman)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  TEST: Paid enquiry with aadhar only (no ayushman)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const [[hospital]] = await conn.query(`SELECT hospital_id FROM hospitals LIMIT 1`);
    const [[district]] = await conn.query(`SELECT district_id FROM districts LIMIT 1`);
    const [[user]]     = await conn.query(`SELECT user_id FROM users LIMIT 1`);

    if (!hospital || !district || !user) {
      console.log('  ⚠️  Skipping insert test — no seed data found\n');
    } else {
      try {
        await conn.beginTransaction();
        const [r] = await conn.query(`
          INSERT INTO enquiries (
            enquiry_code, patient_name, medical_condition,
            hospital_id, source_hospital_id, district_id,
            contact_name, contact_phone, contact_email,
            submitted_by_user_id, father_spouse_name, age, gender,
            address, vitals, air_transport_type,
            aadhar_card_number, ayushman_card_number,
            chief_complaint, general_condition,
            bed_availability_confirmed, als_ambulance_arranged
          ) VALUES (
            'TEST-PAID-002', 'Test Patient', 'Test Condition',
            ?, ?, ?,
            'Test Contact', '9876543210', 'test@test.com',
            ?, 'Test Father', 30, 'Male',
            'Test Address', 'Stable', 'Paid',
            '123456789012', NULL,
            NULL, NULL,
            0, 0
          )
        `, [hospital.hospital_id, hospital.hospital_id, district.district_id, user.user_id]);
        await conn.rollback();
        console.log(`  ✅ Test INSERT passed (rolled back) — Paid enquiry works now!\n`);
      } catch (e) {
        await conn.rollback();
        console.log(`  ❌ Test INSERT still failing: ${e.message}\n`);
        console.log('  👉 Try removing constraint entirely — run step below manually:\n');
        console.log('     ALTER TABLE enquiries DROP CHECK chk_identity_card_validation;\n');
      }
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  } finally {
    if (conn) await conn.end();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

run();
