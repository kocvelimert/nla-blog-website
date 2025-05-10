const express = require("express")
const router = express.Router()
const postController = require("../controllers/postController")
const multer = require("multer")



// Create a special upload configuration that accepts any field name
// This is needed for dynamic file field names from the frontend
const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
}).any()

router.get("/", postController.getAllPosts)
router.get("/:id", postController.getPostById)
router.get("/category/:category", postController.getPostsByCategory)
router.get("/tag/:tag", postController.getPostsByTag)

// Use uploadAny for the create post route to accept any field names
router.post(
  "/",
  uploadAny,
  postController.createPost,
)

// Use uploadAny for the update post route to accept any field names
router.patch(
  "/:id",
  uploadAny,
  postController.updatePost,
)

router.delete("/:id", postController.deletePost)

module.exports = router
