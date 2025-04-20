const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");

// Use memory storage for all uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.get("/category/:category", postController.getPostsByCategory);
router.get("/tag/:tag", postController.getPostsByTag);

router.post("/", upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 }
]), postController.createPost);

router.patch("/:id", upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 }
]), postController.updatePost);

router.delete("/:id", postController.deletePost);

module.exports = router;