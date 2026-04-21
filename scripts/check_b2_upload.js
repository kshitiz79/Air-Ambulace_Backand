/**
 * Tests B2 upload and returns the public URL
 * Run: node scripts/check_b2_upload.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { uploadToB2 } = require('../src/services/b2Service');
const fs = require('fs');
const path = require('path');

async function run() {
  // Create a tiny test file
  const testFile = path.join(__dirname, 'test-upload.txt');
  fs.writeFileSync(testFile, 'Air Ambulance B2 test ' + new Date().toISOString());

  console.log('Uploading test file to B2...');
  try {
    const url = await uploadToB2(testFile, 'test-upload.txt');
    console.log('\n✅ Upload successful!');
    console.log('Public URL:', url);
    console.log('\nTry opening this URL in your browser to verify it is publicly accessible.');
  } catch (err) {
    console.error('\n❌ Upload failed:', err.message);
    console.log('\nCheck:');
    console.log('  1. B2_S3_ENDPOINT, B2_S3_ACCESS_KEY, B2_S3_SECRET_KEY, B2_S3_BUCKET_NAME in .env');
    console.log('  2. Bucket must be set to "Public" in Backblaze dashboard');
  } finally {
    fs.unlinkSync(testFile);
  }
}

run();
