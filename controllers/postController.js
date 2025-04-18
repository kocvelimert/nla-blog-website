const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Post = require("../models/Post");
const { generateId, generateSlug } = require("../utils/helpers");
const cloudinary = require('cloudinary');

// GET: Hepsi
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();

    // Her post için Cloudinary'den görsel URL'lerini ekle
    const postsWithMedia = await Promise.all(
      posts.map(async (post) => {
        // Thumbnail için URL'yi ekle
        if (post.thumbnail) {
          const thumbnailUrl = cloudinary.url(post.thumbnail, {
            resource_type: "image",
            width: 600,
            height: 400,
            crop: "fill",
            fetch_format: "auto",
          });
          post.thumbnail = thumbnailUrl;
        }

        // İçerik resimleri için URL'leri ekle
        if (post.content && Array.isArray(post.content)) {
          post.content = await Promise.all(
            post.content.map(async (block) => {
              if (block.type === "image" && block.data?.filename) {
                const imageUrl = cloudinary.url(block.data.filename, {
                  resource_type: "image",
                  width: 800,
                  height: 600,
                  crop: "fill",
                  fetch_format: "auto",
                });
                block.data.filename = imageUrl;
              }
              return block;
            })
          );
        }

        return post;
      })
    );

    res.json(postsWithMedia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching posts" });
  }
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
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Thumbnail için URL'yi ekle
    if (post.thumbnail) {
      const thumbnailUrl = cloudinary.url(post.thumbnail, {
        resource_type: "image",
        width: 600,
        height: 400,
        crop: "fill",
        fetch_format: "auto",
      });
      post.thumbnail = thumbnailUrl;
    }

    // İçerik resimleri için URL'leri ekle
    if (post.content && Array.isArray(post.content)) {
      post.content = await Promise.all(
        post.content.map(async (block) => {
          if (block.type === "image" && block.data?.filename) {
            const imageUrl = cloudinary.url(block.data.filename, {
              resource_type: "image",
              width: 800,
              height: 600,
              crop: "fill",
              fetch_format: "auto",
            });
            block.data.filename = imageUrl;
          }
          return block;
        })
      );
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while fetching post" });
  }
};


// Multer memory storage (zaten yukarıda tanımlı olduğunu varsayıyorum)
const uploadFiles = multer({ storage: multer.memoryStorage() }).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 20 },
]);

exports.createPost = (req, res) => {
  uploadFiles(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const data = req.body;
      const slug = generateSlug(data.title || "untitled");
      const createdAt = new Date();

      const thumbnailFile = req.files?.thumbnail?.[0];
      const contentImageFiles = req.files?.images || [];

      // Thumbnail Cloudinary'e yükleniyor
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const result = await uploadToCloudinary(thumbnailFile.buffer, "thumbnails", slug);
        thumbnailUrl = result.secure_url;
      }

      // Content parçalarını çözümle
      let contentBlocks = [];
      if (data.content && typeof data.content === "string") {
        contentBlocks = JSON.parse(data.content);

        let imageIndex = 1;
        for (let block of contentBlocks) {
          if (block.type === "image" && block.data?.filename) {
            const originalName = block.data.filename;
            const file = contentImageFiles.find(f => f.originalname === originalName);

            if (file) {
              const publicId = `${slug}-${imageIndex}`;
              const result = await uploadToCloudinary(file.buffer, "content-images", publicId);
              block.data.filename = result.secure_url;
              imageIndex++;
            }
          }
        }
      }

      const post = new Post({
        title: data.title,
        slug,
        formatCategory: data.formatCategory,
        contentCategory: data.contentCategory,
        tags: JSON.parse(data.tags || "[]"),
        thumbnail: thumbnailUrl,
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

      // Thumbnail güncellemesi gerekiyorsa
      let thumbnailUrl = existing.thumbnail;
      if (thumbnailFile) {
        const slug = generateSlug(data.title ?? existing.title);
        const result = await uploadToCloudinary(thumbnailFile.buffer, "thumbnails", slug);
        thumbnailUrl = result.secure_url;
      }

      // Content güncellemesi
      let updatedContent = existing.content;
      if (data.content && typeof data.content === "string") {
        updatedContent = JSON.parse(data.content);
        const slug = generateSlug(data.title ?? existing.title);

        let imageIndex = 1;
        for (let block of updatedContent) {
          if (block.type === "image" && block.data?.filename) {
            const originalName = block.data.filename;
            const file = contentImageFiles.find(f => f.originalname === originalName);

            if (file) {
              const publicId = `${slug}-${imageIndex}`;
              const result = await uploadToCloudinary(file.buffer, "content-images", publicId);
              block.data.filename = result.secure_url;
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
          thumbnail: thumbnailUrl,
          editDates: [...existing.editDates, new Date()],
          author: data.author ?? existing.author,
          status: data.status === "true" || false,
          content: updatedContent,
        },
        { new: true }
      );

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error while updating post" });
    }
  });
};

// DELETE: Silme
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // Veritabanındaki postu bul
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Cloudinary'deki dosyaları sil
    if (post.thumbnail) {
      const thumbnailPublicId = post.thumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });
    }

    // İçerik resimlerini sil
    if (post.content && Array.isArray(post.content)) {
      for (let block of post.content) {
        if (block.type === 'image' && block.data?.filename) {
          const imagePublicId = block.data.filename.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(imagePublicId, { resource_type: 'image' });
        }
      }
    }

    // Veritabanından sil
    await Post.findByIdAndDelete(id);

    res.json({ message: "Post deleted successfully, and associated media removed from Cloudinary." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while deleting post" });
  }
};