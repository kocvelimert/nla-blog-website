const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Post = require("../models/Post");
const { generateId, generateSlug } = require("../utils/helpers");
const cloudinary = require("cloudinary");
const uploadToCloudinary = require('../utils/uploadToCloudinary.js');


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
    return res
      .status(404)
      .json({ message: "No posts found for this category" });

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


exports.createPost = async (req, res) => {
  try {
    console.log("🛠️ createPost endpoint called");
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);

    const data = req.body;
    const slug = generateSlug(data.title || "untitled");
    const createdAt = new Date();

    // Parse tags safely
    let tags = [];
    try {
      if (data.tags) {
        tags = Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags);
      }
    } catch (error) {
      console.error("Error parsing tags:", error);
    }

    // Handle thumbnail
    let thumbnailPublicId = null;
    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
      console.log("✅ Thumbnail file received");
      const thumbnailFile = req.files.thumbnail[0];
      try {
        const result = await uploadToCloudinary(
          thumbnailFile.buffer,
          "thumbnails",
          `${slug}-thumbnail`
        );
        thumbnailPublicId = result.public_id;
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
        return res.status(500).json({ error: "Error uploading thumbnail" });
      }
    }

    // Parse content blocks
    let contentBlocks = [];
    try {
      if (data.content) {
        contentBlocks = Array.isArray(data.content) 
          ? data.content 
          : JSON.parse(data.content);
      }
    } catch (error) {
      console.error("Error parsing content:", error);
      return res.status(400).json({ error: "Invalid content format" });
    }

    // Process content images
    const contentImageFiles = req.files?.images || [];
    let imageIndex = 1;
    
    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];
      if (block.type === "image" && block.url) {
        // If it's a new image upload (not an existing URL)
        if (!block.url.startsWith("http")) {
          const originalName = block.url;
          const file = contentImageFiles.find(
            (f) => f.originalname === originalName
          );

          if (file) {
            const publicId = `content-images/${slug}-${imageIndex}`;
            try {
              const result = await uploadToCloudinary(
                file.buffer,
                "content-images",
                `${slug}-${imageIndex}`
              );
              contentBlocks[i].url = result.public_id; // Store public_id
              imageIndex++;
            } catch (error) {
              console.error("Error uploading content image:", error);
            }
          }
        }
      }
    }

    // Create and save the post
    const post = new Post({
      title: data.title,
      slug,
      formatCategory: data.formatCategory,
      contentCategory: data.contentCategory,
      tags: tags,
      thumbnail: thumbnailPublicId,
      createdAt,
      editDates: [],
      author: data.author || "unknown",
      status: Boolean(data.status === "true" || data.status === true),
      content: contentBlocks,
    });

    const saved = await post.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Error while saving post" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Post.findById(id);
    if (!existing) return res.status(404).json({ error: "Post not found" });

    const data = req.body;
    const slug = generateSlug(data.title || existing.title);
    
    // Handle thumbnail update
    let thumbnailPublicId = existing.thumbnail;
    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      try {
        // Delete old thumbnail if it exists
        if (existing.thumbnail) {
          await cloudinary.uploader.destroy(existing.thumbnail);
        }
        
        const result = await uploadToCloudinary(
          thumbnailFile.buffer,
          "thumbnails",
          `${slug}-thumbnail`
        );
        thumbnailPublicId = result.public_id;
      } catch (error) {
        console.error("Error updating thumbnail:", error);
      }
    }

    // Parse content blocks
    let contentBlocks = existing.content;
    try {
      if (data.content) {
        contentBlocks = Array.isArray(data.content) 
          ? data.content 
          : JSON.parse(data.content);
      }
    } catch (error) {
      console.error("Error parsing content:", error);
      return res.status(400).json({ error: "Invalid content format" });
    }

    // Process content images
    const contentImageFiles = req.files?.images || [];
    let imageIndex = 1;
    
    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];
      if (block.type === "image" && block.url) {
        // If it's a new image upload (not an existing URL or public_id)
        if (!block.url.startsWith("http") && !block.url.includes("/")) {
          const originalName = block.url;
          const file = contentImageFiles.find(
            (f) => f.originalname === originalName
          );

          if (file) {
            const publicId = `content-images/${slug}-${imageIndex}`;
            try {
              const result = await uploadToCloudinary(
                file.buffer,
                "content-images",
                `${slug}-${imageIndex}`
              );
              contentBlocks[i].url = result.public_id;
              imageIndex++;
            } catch (error) {
              console.error("Error uploading content image:", error);
            }
          }
        }
      }
    }

    // Parse tags
    let tags = existing.tags;
    try {
      if (data.tags) {
        tags = Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags);
      }
    } catch (error) {
      console.error("Error parsing tags:", error);
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      {
        title: data.title || existing.title,
        slug: slug,
        formatCategory: data.formatCategory || existing.formatCategory,
        contentCategory: data.contentCategory || existing.contentCategory,
        tags: tags,
        thumbnail: thumbnailPublicId,
        editDates: [...existing.editDates, new Date()],
        author: data.author || existing.author,
        status: Boolean(data.status === "true" || data.status === true),
        content: contentBlocks,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Error while updating post" });
  }
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
      const thumbnailPublicId = post.thumbnail.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(thumbnailPublicId, {
        resource_type: "image",
      });
    }

    // İçerik resimlerini sil
    if (post.content && Array.isArray(post.content)) {
      for (let block of post.content) {
        if (block.type === "image" && block.data?.filename) {
          const imagePublicId = block.data.filename
            .split("/")
            .pop()
            .split(".")[0];
          await cloudinary.uploader.destroy(imagePublicId, {
            resource_type: "image",
          });
        }
      }
    }

    // Veritabanından sil
    await Post.findByIdAndDelete(id);

    res.json({
      message:
        "Post deleted successfully, and associated media removed from Cloudinary.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while deleting post" });
  }
};
