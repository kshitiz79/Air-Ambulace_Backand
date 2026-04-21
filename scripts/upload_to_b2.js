require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
  endpoint: process.env.B2_S3_ENDPOINT,
  region: process.env.B2_S3_REGION,
  credentials: {
    accessKeyId: process.env.B2_S3_ACCESS_KEY,
    secretAccessKey: process.env.B2_S3_SECRET_KEY,
  },
  forcePathStyle: true, // Backblaze B2 requires forcePathStyle
});

const uploadFile = async (filePath, bucketName) => {
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);

  const uploadParams = {
    Bucket: bucketName,
    Key: `anu/uploads/${Date.now()}-${fileName}`, // Adding prefix 'anu/' as required by the key's restriction
    Body: fileStream,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('Upload Success', data);
    const fileUrl = `${process.env.B2_S3_ENDPOINT}/${bucketName}/${uploadParams.Key}`;
    console.log('File URL:', fileUrl);
    return fileUrl;
  } catch (err) {
    console.error('Upload Error', err);
    throw err;
  }
};

const filePath = '/Users/kshitizmaurya/Downloads/Gem.png';
const bucketName = process.env.B2_S3_BUCKET_NAME;

if (fs.existsSync(filePath)) {
  uploadFile(filePath, bucketName)
    .then((url) => {
      console.log('Final URL:', url);
    })
    .catch((err) => {
      console.error('Failed to upload:', err);
    });
} else {
  console.error('File not found:', filePath);
}
