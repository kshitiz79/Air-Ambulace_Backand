// Debug script for district update issues
const { Enquiry, District, User } = require('./src/model');
const jwt = require('jsonwebtoken');

async function debugDistrictUpdate() {
  try {
    console.log('=== District Update Debug Script ===\n');

    // 1. Check available districts
    console.log('1. Available Districts:');
    const districts = await District.findAll({
      attributes: ['district_id', 'district_name'],
      order: [['district_name', 'ASC']]
    });
    
    districts.forEach(district => {
      console.log(`   ${district.district_id}: ${district.district_name}`);
    });
    console.log('');

    // 2. Check CMO users and their districts
    console.log('2. CMO Users:');
    const cmoUsers = await User.findAll({
      where: { role: 'CMO' },
      attributes: ['user_id', 'username', 'full_name', 'district_id'],
      include: [{
        model: District,
        as: 'district',
        attributes: ['district_name']
      }]
    });

    cmoUsers.forEach(user => {
      console.log(`   ${user.user_id}: ${user.username} (${user.full_name}) - District: ${user.district_id} (${user.district?.district_name || 'N/A'})`);
    });
    console.log('');

    // 3. Check enquiries and their districts
    console.log('3. Recent Enquiries (last 5):');
    const enquiries = await Enquiry.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'district_id', 'submitted_by_user_id'],
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['district_name']
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['username', 'role']
        }
      ]
    });

    enquiries.forEach(enquiry => {
      console.log(`   ${enquiry.enquiry_id}: ${enquiry.enquiry_code} - ${enquiry.patient_name}`);
      console.log(`      District: ${enquiry.district_id} (${enquiry.district?.district_name || 'N/A'})`);
      console.log(`      Submitted by: ${enquiry.submittedBy?.username} (${enquiry.submittedBy?.role})`);
      console.log('');
    });

    // 4. Test district update simulation
    if (enquiries.length > 0) {
      const testEnquiry = enquiries[0];
      const currentDistrictId = testEnquiry.district_id;
      const newDistrict = districts.find(d => d.district_id !== currentDistrictId);
      
      if (newDistrict) {
        console.log('4. Testing District Update:');
        console.log(`   Enquiry: ${testEnquiry.enquiry_code}`);
        console.log(`   Current District: ${currentDistrictId} (${testEnquiry.district?.district_name})`);
        console.log(`   New District: ${newDistrict.district_id} (${newDistrict.district_name})`);
        
        try {
          await testEnquiry.update({ district_id: newDistrict.district_id });
          console.log('   ✅ Update successful!');
          
          // Revert the change
          await testEnquiry.update({ district_id: currentDistrictId });
          console.log('   ✅ Reverted successfully!');
        } catch (error) {
          console.log('   ❌ Update failed:', error.message);
        }
      }
    }

    console.log('\n=== Debug Complete ===');

  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the debug script
debugDistrictUpdate();