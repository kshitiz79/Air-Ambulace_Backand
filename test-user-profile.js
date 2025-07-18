// Simple test script to verify user profile endpoints
const baseUrl = 'http://localhost:4000';

async function testUserProfileEndpoints() {
  console.log('🚀 Testing User Profile Endpoints...\n');

  try {
    // Test 1: Get all users
    console.log('1. Testing GET /api/users');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    const usersData = await usersResponse.json();
    console.log('✅ Status:', usersResponse.status);
    console.log('📊 Response:', JSON.stringify(usersData, null, 2));
    console.log('---\n');

    // Test 2: Get user by ID (if users exist)
    if (usersData.data && usersData.data.length > 0) {
      const firstUser = usersData.data[0];
      console.log('2. Testing GET /api/users/:id');
      
      // You'll need to add a valid token here for authentication
      const token = 'your-jwt-token-here'; // Replace with actual token
      
      const userResponse = await fetch(`${baseUrl}/api/users/${firstUser.user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const userData = await userResponse.json();
      console.log('✅ Status:', userResponse.status);
      console.log('📊 User Data:', JSON.stringify(userData, null, 2));
      console.log('---\n');

      // Test 3: Update user profile
      console.log('3. Testing PUT /api/users/:id');
      const updateResponse = await fetch(`${baseUrl}/api/users/${firstUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: 'Updated Test Name',
          phone: '9876543210',
          address: 'Updated Test Address'
        })
      });
      
      const updateData = await updateResponse.json();
      console.log('✅ Status:', updateResponse.status);
      console.log('📊 Update Response:', JSON.stringify(updateData, null, 2));
      console.log('---\n');
    } else {
      console.log('⚠️ No users found to test individual endpoints');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for running the test
console.log('📝 Instructions:');
console.log('1. Make sure your backend server is running on port 4000');
console.log('2. Replace "your-jwt-token-here" with a valid JWT token');
console.log('3. Run: node test-user-profile.js\n');

// Uncomment the line below to run the test
// testUserProfileEndpoints();