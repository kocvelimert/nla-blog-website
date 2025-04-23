// middlewares/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Improved transformation settings
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_posts",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { width: 1600, crop: "limit" }, // Limit width but maintain aspect ratio
      { quality: "auto:good" }, // Automatic quality optimization
      { fetch_format: "auto" } // Best format per browser
    ],
  },
});

const upload = multer({ storage });

module.exports = upload;