const express = require("express")
const router = express.Router()
const postController = require("../controllers/postController")
const multer = require("multer")

// Increase file size limit to 100MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
})

router.get("/", postController.getAllPosts)
router.get("/category/:category", postController.getPostsByCategory)
router.get("/tag/:tag", postController.getPostsByTag)
router.get('/popular-tags', postController.getPopularTags);
router.get("/:id", postController.getPostById)

router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  postController.createPost,
)

router.patch(
  "/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ]),
  postController.updatePost,
)

router.delete("/:id", postController.deletePost)

module.exports = router
