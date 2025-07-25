// Test script to verify API endpoints are working
const baseUrl = 'http://localhost:4000';

// Test function
async function testEndpoint(endpoint, token) {
  try {
    console.log(`Testing: ${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${endpoint} - Success`);
      return true;
    } else {
      console.log(`❌ ${endpoint} - Failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Air Team API Endpoints...\n');
  
  // You'll need to replace this with a valid token
  const token = 'your-jwt-token-here';
  
  const endpoints = [
    '/api/enquiries',
    '/api/flight-assignments',
    '/api/post-operation-reports',
    '/api/invoices',
    '/api/case-closures',
    '/api/ambulances/available'
  ];
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint, token);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`\n📊 Results: ${passed}/${total} endpoints working`);
  
  if (passed === total) {
    console.log('🎉 All endpoints are working!');
  } else {
    console.log('⚠️  Some endpoints need attention');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint, runTests };