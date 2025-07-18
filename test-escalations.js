// Simple test script to verify escalation endpoints
const baseUrl = 'http://localhost:4000';

async function testEscalationEndpoints() {
  console.log('🚀 Testing Case Escalation Endpoints...\n');

  try {
    // Test 1: Get all escalations
    console.log('1. Testing GET /api/case-escalations');
    const escalationsResponse = await fetch(`${baseUrl}/api/case-escalations`);
    const escalationsData = await escalationsResponse.json();
    console.log('✅ Status:', escalationsResponse.status);
    console.log('📊 Response:', JSON.stringify(escalationsData, null, 2));
    console.log('---\n');

    // Test 2: Get all enquiries
    console.log('2. Testing GET /api/enquiries');
    const enquiriesResponse = await fetch(`${baseUrl}/api/enquiries`);
    const enquiriesData = await enquiriesResponse.json();
    console.log('✅ Status:', enquiriesResponse.status);
    console.log('📊 Found', enquiriesData.data?.length || 0, 'enquiries');
    
    if (enquiriesData.data && enquiriesData.data.length > 0) {
      const firstEnquiry = enquiriesData.data[0];
      console.log('📋 First enquiry:', {
        id: firstEnquiry.enquiry_id,
        code: firstEnquiry.enquiry_code,
        patient: firstEnquiry.patient_name,
        status: firstEnquiry.status
      });
    }
    console.log('---\n');

    // Test 3: Create escalation (if we have enquiries)
    if (enquiriesData.data && enquiriesData.data.length > 0) {
      const enquiryToEscalate = enquiriesData.data.find(e => e.status !== 'ESCALATED') || enquiriesData.data[0];
      
      console.log('3. Testing POST /api/enquiries/:id/escalate');
      const escalateResponse = await fetch(`${baseUrl}/api/enquiries/${enquiryToEscalate.enquiry_id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escalation_reason: 'Test escalation - urgent medical attention required',
          escalated_to: 'District Magistrate',
          escalated_by_user_id: 1 // Assuming user ID 1 exists
        })
      });
      
      const escalateData = await escalateResponse.json();
      console.log('✅ Status:', escalateResponse.status);
      console.log('📊 Response:', JSON.stringify(escalateData, null, 2));
      console.log('---\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEscalationEndpoints();