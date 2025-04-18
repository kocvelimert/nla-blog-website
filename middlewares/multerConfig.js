// const multer = require("multer");
// const path = require("path");

// const uploadFiles = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       const isThumbnail = file.fieldname === "thumbnail";
//       const dir = isThumbnail ? "uploads/thumbnails" : "uploads/content-images";
//       cb(null, dir);
//     },
//     filename: function (req, file, cb) {
//       const ext = path.extname(file.originalname);
//       if (file.fieldname === "thumbnail") {
//         const slug = generateSlug(req.body.title || "untitled");
//         cb(null, `${slug}${ext}`);
//       } else {
//         cb(null, file.originalname);
//       }
//     },
//   }),
// }).fields([
//   { name: "thumbnail", maxCount: 1 },
//   { name: "images", maxCount: 20 },
// ]);

// module.exports = uploadFiles;
