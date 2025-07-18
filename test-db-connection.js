// Simple database connection test for production
const sequelize = require('./src/config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  console.log('Environment Variables:');
  console.log('- DB_HOST:', process.env.DB_HOST);
  console.log('- DB_USER:', process.env.DB_USER);
  console.log('- DB_NAME:', process.env.DB_NAME);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('');

  try {
    console.log('Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test if users table exists
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table accessible. Found ${results[0].count} users.`);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.original?.code);
    console.error('Error errno:', error.original?.errno);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

testDatabaseConnection();