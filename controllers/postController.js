const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Post = require("../models/Post");
const { generateId, generateSlug } = require("../utils/helpers");

// Upload klasörlerini oluştur
const contentImagePath = "uploads/content-images";
const thumbnailPath = "uploads/thumbnails";

[contentImagePath, thumbnailPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer konfigürasyonu
const uploadFiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir =
        file.fieldname === "thumbnail" ? thumbnailPath : contentImagePath;
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      if (file.fieldname === "thumbnail") {
        const slug = generateSlug(req.body.title || "untitled");
        cb(null, `${slug}${ext}`);
      } else {
        cb(null, file.originalname);
      }
    },
  }),
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 20 },
]);

// GET: Hepsi
exports.getAllPosts = async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
};

// GET: Kategoriye göre
exports.getPostsByCategory = async (req, res) => {
  const { category } = req.params;
  const posts = await Post.find({
    $or: [{ formatCategory: category }, { contentCategory: category }],
  });

  if (posts.length === 0)
    return res.status(404).json({ message: "No posts found for this category" });

  res.json(posts);
};

// GET: Etikete göre
exports.getPostsByTag = async (req, res) => {
  const { tag } = req.params;
  const posts = await Post.find({ tags: tag });

  if (posts.length === 0)
    return res.status(404).json({ message: "No posts found for this tag" });

  res.json(posts);
};

// GET: Tekil
exports.getPostById = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
};

// POST: Yeni gönderi
exports.createPost = (req, res) => {
  uploadFiles(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const data = req.body;
      const slug = generateSlug(data.title);
      const createdAt = new Date();

      const thumbnailFile = req.files?.thumbnail?.[0];
      const contentImageFiles = req.files?.images || [];

      let contentBlocks = [];
      if (data.content && typeof data.content === "string") {
        contentBlocks = JSON.parse(data.content);
      }

      // İçerik resimlerini yeniden adlandır
      const id = generateId();
      let imageIndex = 1;

      for (let block of contentBlocks) {
        if (block.type === "image" && block.data?.filename) {
          const originalName = block.data.filename;
          const file = contentImageFiles.find(
            (f) => f.originalname === originalName
          );
          if (file) {
            const ext = path.extname(originalName);
            const newFilename = `${id}-${imageIndex}${ext}`;
            const newPath = path.join(path.dirname(file.path), newFilename);

            fs.renameSync(file.path, newPath);
            block.data.filename = newFilename;
            imageIndex++;
          }
        }
      }

      const post = new Post({
        title: data.title,
        slug,
        formatCategory: data.formatCategory,
        contentCategory: data.contentCategory,
        tags: JSON.parse(data.tags || "[]"),
        thumbnail: thumbnailFile?.filename || null,
        createdAt,
        editDates: [],
        author: data.author || "unknown",
        status: data.status === "true" || false,
        content: contentBlocks,
      });

      const saved = await post.save();
      res.status(201).json(saved);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error while saving post" });
    }
  });
};

// PATCH: Güncelleme
exports.updatePost = (req, res) => {
  uploadFiles(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const { id } = req.params;
      const existing = await Post.findById(id);
      if (!existing) return res.status(404).json({ error: "Post not found" });

      const data = req.body;
      const thumbnailFile = req.files?.thumbnail?.[0];
      const contentImageFiles = req.files?.images || [];

      // Yeni içerik varsa işle
      let updatedContent = existing.content;
      if (data.content && typeof data.content === "string") {
        updatedContent = JSON.parse(data.content);

        let imageIndex = 1;

        for (let block of updatedContent) {
          if (block.type === "image" && block.data?.filename) {
            const originalName = block.data.filename;
            const file = contentImageFiles.find(
              (f) => f.originalname === originalName
            );
            if (file) {
              const ext = path.extname(originalName);
              const newFilename = `${id}-${imageIndex}${ext}`;
              const newPath = path.join(path.dirname(file.path), newFilename);

              fs.renameSync(file.path, newPath);
              block.data.filename = newFilename;
              imageIndex++;
            }
          }
        }
      }

      const updated = await Post.findByIdAndUpdate(
        id,
        {
          title: data.title ?? existing.title,
          slug: generateSlug(data.title ?? existing.title),
          formatCategory: data.formatCategory ?? existing.formatCategory,
          contentCategory: data.contentCategory ?? existing.contentCategory,
          tags: JSON.parse(data.tags || "[]"),
          thumbnail: thumbnailFile?.filename ?? existing.thumbnail,
          editDates: [...existing.editDates, new Date()],
          author: data.author ?? existing.author,
          status: data.status === "true" || false,
          content: updatedContent,
        },
        { new: true }
      );

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error while updating post" });
    }
  });
};

// DELETE: Silme
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const deleted = await Post.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Post not found" });
  res.json({ message: "Post deleted successfully" });
};
