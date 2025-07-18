// Debug script to test login functionality
const bcrypt = require("bcryptjs");
const User = require("./src/model/User");
const sequelize = require("./src/config/database");

async function debugLogin() {
  console.log('🔍 Debugging Login Issues...\n');

  try {
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if User table exists and has data
    console.log('2. Checking User table...');
    const userCount = await User.count();
    console.log(`✅ User table exists with ${userCount} users\n`);

    // Test 3: List all users
    console.log('3. Listing all users...');
    const users = await User.findAll({
      attributes: ['user_id', 'username', 'role', 'full_name', 'email'],
      limit: 5
    });
    console.log('Users found:');
    users.forEach(user => {
      console.log(`- ID: ${user.user_id}, Username: ${user.username}, Role: ${user.role}`);
    });
    console.log('');

    // Test 4: Try to find the test user
    console.log('4. Looking for testcmo user...');
    const testUser = await User.findOne({ where: { username: 'testcmo' } });
    if (testUser) {
      console.log('✅ testcmo user found:');
      console.log(`- ID: ${testUser.user_id}`);
      console.log(`- Username: ${testUser.username}`);
      console.log(`- Role: ${testUser.role}`);
      console.log(`- Email: ${testUser.email}`);
      console.log(`- Has password hash: ${!!testUser.password_hash}`);
      
      // Test 5: Test password comparison
      console.log('\n5. Testing password comparison...');
      const isPasswordValid = await bcrypt.compare('Password123', testUser.password_hash);
      console.log(`Password 'Password123' is ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    } else {
      console.log('❌ testcmo user not found');
      
      // Create test user
      console.log('\n5. Creating testcmo user...');
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const newUser = await User.create({
        username: 'testcmo',
        password_hash: hashedPassword,
        full_name: 'Test CMO User',
        email: 'testcmo@example.com',
        role: 'CMO',
        district_id: 1
      });
      console.log('✅ testcmo user created successfully');
      console.log(`- ID: ${newUser.user_id}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the debug
debugLogin();