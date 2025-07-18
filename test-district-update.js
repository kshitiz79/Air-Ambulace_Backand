// Test script to verify district update functionality
const baseUrl = 'http://localhost:3000'; // Adjust if your backend runs on a different port

async function testDistrictUpdate() {
  try {
    // First, login as CMO to get token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testcmo', // Adjust with your CMO username
        password: 'password123' // Adjust with your CMO password
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');

    // Get list of enquiries to find one to update
    const enquiriesResponse = await fetch(`${baseUrl}/api/enquiries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!enquiriesResponse.ok) {
      throw new Error('Failed to fetch enquiries');
    }

    const enquiriesData = await enquiriesResponse.json();
    console.log('Found', enquiriesData.data.length, 'enquiries');

    if (enquiriesData.data.length === 0) {
      console.log('No enquiries found to test with');
      return;
    }

    const enquiry = enquiriesData.data[0];
    console.log('Testing with enquiry ID:', enquiry.enquiry_id);
    console.log('Current district_id:', enquiry.district_id);

    // Get list of districts
    const districtsResponse = await fetch(`${baseUrl}/api/districts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!districtsResponse.ok) {
      throw new Error('Failed to fetch districts');
    }

    const districtsData = await districtsResponse.json();
    console.log('Available districts:', districtsData.data.map(d => `${d.district_id}: ${d.district_name}`));

    // Find a different district to update to
    const newDistrict = districtsData.data.find(d => d.district_id !== enquiry.district_id);
    if (!newDistrict) {
      console.log('No different district found to test with');
      return;
    }

    console.log('Attempting to update district to:', newDistrict.district_id, '-', newDistrict.district_name);

    // Attempt to update the district
    const updateResponse = await fetch(`${baseUrl}/api/enquiries/${enquiry.enquiry_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        district_id: newDistrict.district_id
      })
    });

    const updateData = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.error('Update failed:', updateData);
      return;
    }

    console.log('Update successful!');
    console.log('New district_id:', updateData.data.district_id);
    console.log('District name:', updateData.data.district?.district_name);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testDistrictUpdate();