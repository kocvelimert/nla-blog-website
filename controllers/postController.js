const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Post = require("../models/Post");
const {generateSlug } = require("../utils/helpers");
const cloudinary = require("cloudinary");
const uploadToCloudinary = require('../utils/uploadToCloudinary.js');
const slugify = require('slugify');


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

// GET: Kategoriye göre (with pagination)
exports.getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    
    // Count total posts for this category
    const totalPosts = await Post.countDocuments({
      $or: [{ formatCategory: category }, { contentCategory: category }],
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Get posts for current page
    const posts = await Post.find({
      $or: [{ formatCategory: category }, { contentCategory: category }],
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);
    
    // Process thumbnails and return
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
        
        // Process other post data as needed
        return post;
      })
    );
    
    // Return posts with pagination metadata
    res.json({
      posts: postsWithMedia,
      totalPosts,
      totalPages,
      currentPage: page,
      postsPerPage: limit
    });
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    res.status(500).json({ error: "Error fetching posts" });
  }
};

// GET: Latest posts
exports.getLatestPosts = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 3

    const posts = await Post.find({ status: true }).sort({ createdAt: -1 }).limit(limit)

    res.json(posts)
  } catch (error) {
    console.error("Error fetching latest posts:", error)
    res.status(500).json({ error: "Error fetching latest posts" })
  }
}

// GET: Posts by tag
exports.getPostsByTag = async (req, res) => {
  try {
    const { tag } = req.params
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit

    // Count total posts with this tag
    const totalPosts = await Post.countDocuments({ tags: tag, status: true })

    // Calculate total pages
    const totalPages = Math.ceil(totalPosts / limit)

    // Get posts for current page
    const posts = await Post.find({ tags: tag, status: true }).sort({ createdAt: -1 }).skip(skip).limit(limit)

    // Return posts with pagination metadata
    res.json({
      posts,
      totalPosts,
      totalPages,
      currentPage: page,
      postsPerPage: limit,
    })
  } catch (error) {
    console.error("Error fetching posts by tag:", error)
    res.status(500).json({ error: "Error fetching posts" })
  }
}

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

    // Validate required fields
    if (!req.body.title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const data = req.body;
    const slug = generateSlug(data.title);
    const createdAt = new Date();

    // Parse tags safely
    let tags = [];
    try {
      if (data.tags) {
        tags = Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags);
      }
    } catch (error) {
      console.error("Error parsing tags:", error);
      // Continue with empty tags rather than failing the request
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
          `${slug}-thumbnail-${Date.now()}`
        );
        thumbnailPublicId = result.public_id;
        console.log("Thumbnail uploaded successfully:", result.public_id);
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
        return res.status(500).json({ error: "Error uploading thumbnail: " + error.message });
      }
    }

    // Parse content blocks
    let contentBlocks = [];
    try {
      if (data.content) {
        contentBlocks = Array.isArray(data.content) 
          ? data.content 
          : JSON.parse(data.content);
        console.log(`Parsed ${contentBlocks.length} content blocks`);
      }
    } catch (error) {
      console.error("Error parsing content:", error);
      return res.status(400).json({ error: "Invalid content format: " + error.message });
    }
    
    // Process content images
    if (!req.files?.images || req.files.images.length === 0) {
      console.warn("⚠️ No content images uploaded");
    } else {
      console.log(`Processing ${req.files.images.length} content images`);
    }

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
            try {
              const result = await uploadToCloudinary(
                file.buffer,
                "content-images",
                `${slug}-content-${Date.now()}-${imageIndex}`
              );
              contentBlocks[i].url = result.public_id; // Store public_id
              console.log(`Content image ${imageIndex} uploaded:`, result.public_id);
              imageIndex++;
            } catch (error) {
              console.error("Error uploading content image:", error);
              // Continue with other images rather than failing the request
            }
          } else {
            console.warn(`No matching file found for image with name: ${originalName}`);
          }
        }
      }
    }

    // Create and save the post
    const post = new Post({
      title: data.title,
      slug,
      formatCategory: data.formatCategory || 'Uncategorized',
      contentCategory: data.contentCategory || 'Uncategorized',
      tags: tags,
      thumbnail: thumbnailPublicId,
      createdAt,
      editDates: [],
      author: data.author || "Anonymous",
      status: data.status !== undefined ? Boolean(data.status === "true" || data.status === true) : true,
      content: contentBlocks,
    });

    const saved = await post.save();
    console.log("✅ Post created successfully with ID:", saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Error while saving post: " + error.message });
  }
};

const extractCloudinaryPublicId = (url) => {
  try {
    if (!url.includes("/upload/")) return null
    const parts = url.split("/upload/")[1]
    const publicIdWithExt = parts.split(".")[0]
    return publicIdWithExt
  } catch {
    return null
  }
}

exports.updatePost = async (req, res) => {
  try {
    console.log("🛠️ updatePost endpoint called")
    console.log("req.files:", req.files)
    console.log("req.body:", req.body)

    const { id } = req.params
    const { title, formatCategory, contentCategory, tags, status, content, author } = req.body

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const oldSlug = post.slug
    const newSlug = slugify(title || post.title, { lower: true })

    const ensureFolderExists = async (folder) => {
      try {
        await cloudinary.api.create_folder(folder)
        console.log(`📁 Ensured folder exists: ${folder}`)
      } catch (err) {
        if (err.http_code !== 409) console.warn(`⚠️ Folder creation failed for ${folder}:`, err.message)
      }
    }

    const folders = [
      "archive",
      "thumbnails",
      "content-images",
      "archive/thumbnails",
      "archive/content-images",
    ]
    for (const folder of folders) {
      await ensureFolderExists(folder)
    }

    let thumbnailPublicId = post.thumbnail
    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
      let oldThumbId = post.thumbnail
      if (oldThumbId && oldThumbId.startsWith("http")) {
        oldThumbId = extractCloudinaryPublicId(oldThumbId)
      }

      if (oldThumbId && oldThumbId.startsWith("thumbnails")) {
        const archivePath = oldThumbId.replace("thumbnails", "archive/thumbnails")
        try {
          await cloudinary.uploader.rename(oldThumbId, archivePath, { overwrite: true })
          console.log("📁 Archived old thumbnail to:", archivePath)
        } catch (err) {
          console.warn("⚠️ Thumbnail archiving failed or not found:", err.message)
        }
      }

      const thumbnailFile = req.files.thumbnail[0]
      try {
        const result = await uploadToCloudinary(
          thumbnailFile.buffer,
          "thumbnails",
          `${newSlug}-thumbnail-${Date.now()}`
        )
        thumbnailPublicId = result.public_id
        console.log("✅ Thumbnail uploaded successfully:", result.public_id)
      } catch (error) {
        console.error("Error uploading thumbnail:", error)
        return res.status(500).json({ error: "Error uploading thumbnail: " + error.message })
      }
    }

    let updatedContent = []
    try {
      if (content) {
        updatedContent = Array.isArray(content) ? content : JSON.parse(content)
        console.log("Parsed content blocks:", updatedContent.length)
      } else {
        console.warn("⚠️ No content provided in request")
      }
    } catch (error) {
      console.error("Error parsing content:", error)
      return res.status(400).json({ error: "Invalid content format: " + error.message })
    }

    const contentImageFiles = req.files?.images || []
    console.log("Content image files count:", contentImageFiles.length)

    let imageIndex = 1
    for (let i = 0; i < updatedContent.length; i++) {
      const block = updatedContent[i]
      if (block.type === "image") {
        let oldPublicId = block.url
        if (oldPublicId && oldPublicId.startsWith("http")) {
          oldPublicId = extractCloudinaryPublicId(oldPublicId)
        }

        const targetName = block.filename || block.url || ""
        let file = contentImageFiles.find((f) =>
          [targetName, block.filename, extractCloudinaryPublicId(block.url)]
            .filter(Boolean)
            .some(key => f.originalname.includes(key))
        )

        if (!file && contentImageFiles[i]) {
          file = contentImageFiles[i] // fallback by index
        }

        if (file) {
          if (oldPublicId && oldPublicId.startsWith("content-images")) {
            const archivePath = oldPublicId.replace("content-images", "archive/content-images")
            try {
              await cloudinary.uploader.rename(oldPublicId, archivePath, { overwrite: true })
              console.log("📁 Archived old content image to:", archivePath)
            } catch (err) {
              console.warn("⚠️ Content image archiving failed or not found:", err.message)
            }
          }

          try {
            const result = await uploadToCloudinary(
              file.buffer,
              "content-images",
              `${newSlug}-content-${Date.now()}-${imageIndex}`
            )
            updatedContent[i].url = result.public_id
            delete updatedContent[i].filename
            console.log("✅ Content image uploaded:", result.public_id)
            imageIndex++
          } catch (error) {
            console.error("Error uploading content image:", error)
          }
        }
      } else {
        delete block.filename
      }
    }

    updatedContent = updatedContent.map(block => {
      if (block.type === "image" && block.url?.startsWith("http")) {
        console.warn(`Image block still has HTTP URL instead of Cloudinary public_id: ${block.url}`)
      }
      return block
    })

    console.log("✅ Final updatedContent:", JSON.stringify(updatedContent, null, 2))

    let parsedTags = []
    try {
      if (Array.isArray(tags)) parsedTags = tags
      else if (typeof tags === "string") {
        parsedTags = JSON.parse(tags)
        if (!Array.isArray(parsedTags)) parsedTags = tags.split(",").map(t => t.trim())
      }
    } catch (error) {
      console.error("Error parsing tags:", error)
    }

    post.title = title || post.title
    post.slug = newSlug
    post.formatCategory = formatCategory || post.formatCategory
    post.contentCategory = contentCategory || post.contentCategory
    post.tags = parsedTags
    post.status = Boolean(status === "true" || status === true)
    post.content = updatedContent
    post.thumbnail = thumbnailPublicId
    post.author = author || post.author
    post.editDates = [...(post.editDates || []), new Date().toISOString()]

    const updatedPost = await post.save()
    res.status(200).json({ message: "Post updated successfully", post: updatedPost })
  } catch (error) {
    console.error("Error updating post:", error)
    res.status(500).json({ error: "Error updating post: " + error.message })
  }
}


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
