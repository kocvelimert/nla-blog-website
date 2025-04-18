const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (fileBuffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;
