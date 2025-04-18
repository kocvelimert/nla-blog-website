const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const upload = require('../middlewares/upload');

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.get("/category/:category", postController.getPostsByCategory);
router.get("/tag/:tag", postController.getPostsByTag);

router.post("/", upload.fields([
    { name: "thumbnail", maxCount:1 },
    { name: "images", maxCount:20 }
]) ,postController.createPost);
router.patch("/:id", upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 }
]) ,postController.updatePost);

router.delete("/:id", postController.deletePost);

module.exports = router;
