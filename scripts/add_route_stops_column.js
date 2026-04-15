require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await conn.query('ALTER TABLE flight_assignments ADD COLUMN route_stops TEXT NULL')
    .catch(e => { if (!e.message.includes('Duplicate column')) throw e; });
  console.log('route_stops column added');
  await conn.end();
}
run().catch(console.error);
