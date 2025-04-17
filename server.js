const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generateId, generateSlug } = require("./utils/helpers");

const app = express();
const PORT = 3000;
const postsFile = path.join(__dirname, "data", "posts.json");

const multer = require("multer");

// Serve uploads
app.use("/uploads", express.static("uploads"));

const contentImagePath = "uploads/content-images";
if (!fs.existsSync(contentImagePath)) {
  fs.mkdirSync(contentImagePath, { recursive: true });
}

const uploadPath = "uploads/thumbnails";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ⬇️ Place the multer config BEFORE your route
const uploadFiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const isThumbnail = file.fieldname === "thumbnail";
      const dir = isThumbnail ? "uploads/thumbnails" : "uploads/content-images";
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      if (file.fieldname === "thumbnail") {
        const slug = generateSlug(req.body.title || "untitled");
        cb(null, `${slug}${ext}`);
      } else {
        // content images will be renamed later
        cb(null, file.originalname);
      }
    },
  }),
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 20 },
]);

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Helper to read and write file
function readPosts() {
  return JSON.parse(fs.readFileSync(postsFile));
}

function writePosts(data) {
  fs.writeFileSync(postsFile, JSON.stringify(data, null, 2));
}

// GET all posts
app.get("/posts", (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// GET posts by category (formatCategory or contentCategory)
app.get("/posts/category/:category", (req, res) => {
  const { category } = req.params;
  const posts = readPosts();

  const filteredPosts = posts.filter(
    (post) =>
      post.formatCategory === category || post.contentCategory === category
  );

  if (filteredPosts.length === 0) {
    return res
      .status(404)
      .json({ message: "No posts found for this category" });
  }

  res.json(filteredPosts);
});

// GET posts by tag
app.get("/posts/tag/:tag", (req, res) => {
  const { tag } = req.params;
  const posts = readPosts();

  const filteredPosts = posts.filter((post) => post.tags.includes(tag));

  if (filteredPosts.length === 0) {
    return res.status(404).json({ message: "No posts found for this tag" });
  }

  res.json(filteredPosts);
});

// GET a post
app.get("/posts/:id", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.json(post);
});

//POST a post
app.post("/posts", (req, res) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "File upload error", details: err.message });
    }

    try {
      const data = req.body;
      const id = generateId();
      const slug = generateSlug(data.title);
      const createdAt = new Date().toISOString();

      const thumbnailFile = req.files?.thumbnail?.[0];
      const contentImageFiles = req.files?.images || [];

      let thumbnailFilename = null;
      if (thumbnailFile) {
        thumbnailFilename = thumbnailFile.filename;
      }

      let contentBlocks = [];
      if (req.body.content && typeof req.body.content === "string") {
        try {
          contentBlocks = JSON.parse(req.body.content);
        } catch (e) {
          console.error("Invalid content JSON:", e);
        }
      } else {
        console.log("Content is missing or malformed");
      }

      // Process content images
      // Process content images and rename them like {id}-1, {id}-2, ...
      let imageIndex = 1;
      const originalToNewMap = {};

      for (let block of contentBlocks) {
        if (block.type === "image" && block.data && block.data.filename) {
          const originalName = block.data.filename;
          const file = contentImageFiles.find(
            (f) => f.originalname === originalName
          );
          if (file) {
            const ext = path.extname(originalName);
            const newFilename = `${id}-${imageIndex}${ext}`;
            const newPath = path.join(path.dirname(file.path), newFilename);

            fs.renameSync(file.path, newPath);
            originalToNewMap[originalName] = newFilename;

            block.data.filename = newFilename;
            imageIndex++;
          }
        }
      }

      const newPost = {
        id,
        title: data.title,
        slug,
        formatCategory: data.formatCategory,
        contentCategory: data.contentCategory,
        tags: JSON.parse(data.tags || "[]"),
        thumbnail: thumbnailFilename,
        createdAt,
        editDates: [],
        author: data.author || "unknown",
        status: data.status === "true" || false,
        content: contentBlocks,
      };

      const posts = readPosts();
      posts.push(newPost);
      writePosts(posts);

      res.status(201).json(newPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Unexpected error while processing post" });
    }
  });
});

// PATCH update post
app.patch("/posts/:id", (req, res) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "File upload error", details: err.message });
    }

    try {
      const { id } = req.params;
      const posts = readPosts();
      const postIndex = posts.findIndex((p) => p.id === id);

      if (postIndex === -1) {
        return res.status(404).json({ error: "Post not found" });
      }

      const existingPost = posts[postIndex];
      const data = req.body;

      const thumbnailFile = req.files?.thumbnail?.[0];
      const contentImageFiles = req.files?.images || [];

      let updatedThumbnail = existingPost.thumbnail;

      // Replace thumbnail if new one is uploaded
      if (thumbnailFile) {
        const thumbnailPath = path.join(
          __dirname,
          "uploads/thumbnails",
          existingPost.thumbnail
        );

        // Delete old thumbnail file
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }

        updatedThumbnail = thumbnailFile.filename;
      }

      let updatedContent = existingPost.content;
      if (data.content && typeof data.content === "string") {
        try {
          updatedContent = JSON.parse(data.content);
        } catch (e) {
          console.error("Invalid content JSON:", e);
        }
      }

      // Process and rename new content images
      let imageIndex = 1;
      const originalToNewMap = {};

      for (let block of updatedContent) {
        if (block.type === "image" && block.data && block.data.filename) {
          const originalName = block.data.filename;
          const file = contentImageFiles.find(
            (f) => f.originalname === originalName
          );

          if (file) {
            const ext = path.extname(originalName);
            const newFilename = `${id}-${imageIndex}${ext}`;
            const newPath = path.join(path.dirname(file.path), newFilename);

            // Delete old image if different
            const oldImagePath = path.join(
              __dirname,
              "uploads/content-image",
              originalName
            );
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }

            fs.renameSync(file.path, newPath);
            block.data.filename = newFilename;
            imageIndex++;
          }
        }
      }

      const updatedPost = {
        ...existingPost,
        title: data.title ?? existingPost.title,
        slug: generateSlug(data.title ?? existingPost.title),
        formatCategory: data.formatCategory ?? existingPost.formatCategory,
        contentCategory: data.contentCategory ?? existingPost.contentCategory,
        tags: JSON.parse(data.tags || "[]"),
        thumbnail: updatedThumbnail,
        editDates: [...existingPost.editDates, new Date().toISOString()],
        author: data.author ?? existingPost.author,
        status: data.status === "true" || false,
        content: updatedContent,
      };

      posts[postIndex] = updatedPost;
      writePosts(posts);

      res.json(updatedPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Unexpected error while updating post" });
    }
  });
});


// DELETE post
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;

  let posts = readPosts();
  const post = posts.find((p) => p.id === id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  posts = posts.filter((p) => p.id !== id);
  writePosts(posts);

  res.json({ message: "Post deleted successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
