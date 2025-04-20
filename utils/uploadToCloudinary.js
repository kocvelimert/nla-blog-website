const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = async (fileBuffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(error);
        }
        console.log("✅ Cloudinary upload success:", result.secure_url);
        resolve(result);
      }
    );

    if (!fileBuffer) {
      console.error("⚠️ No buffer provided to upload stream");
      return reject(new Error("Missing file buffer"));
    }

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;
