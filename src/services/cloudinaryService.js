const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File Buffer from memory storage
 * @param {string} originalName - Original name of the file
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return resolve(null);

    const cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'air_ambulance/documents',
        resource_type: 'auto', // Automatically detects image, raw (pdf), etc.
        public_id: `${Date.now()}-${originalName.replace(/\s+/g, '_')}`,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
  });
};

module.exports = {
  uploadToCloudinary
};
