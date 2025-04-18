// middlewares/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// transformation settings
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_posts", // klasör adı (cloudinary içinde)
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, crop: "scale" }],
  },
});

const upload = multer({ storage });

module.exports = upload;
