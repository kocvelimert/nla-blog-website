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

// GET: Popular tags (top 10 most used)
exports.getPopularTags = async (req, res) => {
  try {
    // Aggregate to find the most used tags
    const popularTags = await Post.aggregate([
      // Only consider published posts
      { $match: { status: true } },
      
      // Unwind the tags array to create a document for each tag
      { $unwind: "$tags" },
      
      // Group by tag and count occurrences
      { 
        $group: { 
          _id: "$tags", 
          count: { $sum: 1 } 
        } 
      },
      
      // Sort by count in descending order
      { $sort: { count: -1 } },
      
      // Limit to top 10
      { $limit: 10 },
      
      // Project to rename _id to name for cleaner output
      { 
        $project: { 
          _id: 0, 
          name: "$_id", 
          count: 1 
        } 
      }
    ]);

    res.json(popularTags);
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    res.status(500).json({ error: "Error fetching popular tags" });
  }
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

    // Validate required fields
    if (!req.body.title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // With multer.any(), files are in an array instead of grouped by field name
    const thumbnailFile = req.files?.find(file => file.fieldname === 'thumbnail');
    if (!thumbnailFile) {
      return res.status(400).json({ error: 'Thumbnail image is required' });
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
    }

    // Handle thumbnail
    let thumbnailPublicId = null;
    if (thumbnailFile) {
      console.log("✅ Thumbnail file received:", thumbnailFile.originalname);
      try {
        const result = await uploadToCloudinary(
          thumbnailFile.buffer,
          "thumbnails",
          `${slug}-thumbnail`
        );
        thumbnailPublicId = result.public_id;
        console.log("✅ Thumbnail uploaded to Cloudinary:", thumbnailPublicId);
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
        return res.status(500).json({ error: "Error uploading thumbnail" });
      }
    }

    // Parse content blocks
    let contentBlocks = [];
    try {
      if (data.content) {
        console.log('Content before parsing:', typeof data.content, data.content);
        
        // Handle different content formats
        if (Array.isArray(data.content)) {
          contentBlocks = data.content;
        } else if (typeof data.content === 'string') {
          try {
            contentBlocks = JSON.parse(data.content);
            if (!Array.isArray(contentBlocks)) {
              console.warn('Content parsed but is not an array:', contentBlocks);
              contentBlocks = [{ type: 'paragraph', text: data.content }];
            }
          } catch (parseError) {
            console.warn('Content could not be parsed as JSON, treating as text:', parseError);
            contentBlocks = [{ type: 'paragraph', text: data.content }];
          }
        } else if (typeof data.content === 'object') {
          // If it's already an object but not an array, wrap it
          contentBlocks = [data.content];
        }
        
        console.log('Content after parsing:', contentBlocks);
      }
    } catch (error) {
      console.error("Error processing content:", error);
      return res.status(400).json({ error: "Invalid content format" });
    }
    
    // With multer.any(), all files are in an array
    // Get all files except the thumbnail
    const contentImageFiles = req.files?.filter(file => file.fieldname !== 'thumbnail') || [];
    
    console.log(`Found ${contentImageFiles.length} content image files`);    
    let imageIndex = 1;
    
    // Process content blocks with images
    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];
      if (block.type === "image") {
        console.log(`Processing image block:`, block);
        
        // Check all possible image identifiers
        const imageIdentifier = block.filename || block.src || (block.url && !block.url.startsWith("http") ? block.url : null);
        
        if (imageIdentifier) {
          console.log(`Looking for file with identifier: ${imageIdentifier}`);
          
          // Try to find the file by various matching methods
          let file = contentImageFiles.find(f => 
            f.originalname === imageIdentifier || 
            f.fieldname === imageIdentifier ||
            f.fieldname.includes(imageIdentifier) ||
            (typeof f.originalname === 'string' && imageIdentifier.includes(f.originalname))
          );
          
          // If no exact match, try to find by index if we have files available
          if (!file && contentImageFiles.length > 0 && i < contentImageFiles.length) {
            console.log(`No exact match found, trying to use file at index ${i}`);
            file = contentImageFiles[i];
          }

          if (file) {
            try {
              console.log(`Found file to upload: ${file.originalname || file.fieldname}`);
              const result = await uploadToCloudinary(
                file.buffer,
                "content-images",
                `${slug}-content-${imageIndex}`
              );
              
              // Store the Cloudinary public_id in the url field
              contentBlocks[i].url = result.public_id;
              
              // Remove filename as it's no longer needed
              delete contentBlocks[i].filename;
              delete contentBlocks[i].src;
              
              console.log(`✅ Content image uploaded to Cloudinary: ${result.public_id}`);
              imageIndex++;
            } catch (error) {
              console.error("Error uploading content image:", error);
            }
          } else {
            console.warn(`⚠️ Could not find file for image: ${imageIdentifier}`);
          }
        } else {
          console.warn(`⚠️ Image block has no filename or URL identifier:`, block);
        }
      }
    }

    // Create and save the post
    console.log('Creating post with content blocks:', JSON.stringify(contentBlocks, null, 2));
    
    // Make sure content blocks match the schema structure and frontend format
    const formattedContentBlocks = contentBlocks.map(block => {
      // Ensure each block has the required 'type' field
      if (!block.type) {
        console.warn('Block missing type, defaulting to paragraph:', block);
        block.type = 'paragraph';
      }
      
      // Handle different block types according to frontend format
      let cleanBlock = { type: block.type };
      
      switch (block.type) {
        case 'paragraph':
        case 'heading':
          // For text blocks, use the content or text field
          cleanBlock.text = block.content || block.text || '';
          break;
          
        case 'bulletList':
        case 'orderedList':
          // For list blocks, preserve the content which contains the HTML
          cleanBlock.text = block.content || block.text || '';
          // If there's no content/text but there's HTML content, use that
          if (!cleanBlock.text && block.html) {
            cleanBlock.text = block.html;
          }
          break;
          
        case 'image':
          // For image blocks, preserve the url/src and filename fields
          cleanBlock.url = block.url || block.src || '';
          // Make sure we keep the caption/alt text
          cleanBlock.caption = block.caption || block.alt || '';
          // Keep the filename temporarily if it exists (for debugging)
          if (block.filename) cleanBlock.filename = block.filename;
          
          console.log('Processing image block for database:', { 
            original: block,
            cleaned: cleanBlock 
          });
          break;
          
        case 'youtube':
          // For YouTube blocks, preserve the videoId
          cleanBlock.url = block.videoId || block.url || '';
          break;
          
        case 'blockquote':
          // For quote blocks
          cleanBlock.text = block.content || block.text || '';
          break;
          
        default:
          // For any other block types, copy all properties
          Object.assign(cleanBlock, block);
      }
      
      // If it's a data object with nested properties, flatten it
      if (block.data) {
        if (block.data.text) cleanBlock.text = block.data.text;
        if (block.data.url) cleanBlock.url = block.data.url;
        if (block.data.caption) cleanBlock.caption = block.data.caption;
        if (block.data.filename) cleanBlock.filename = block.data.filename;
      }
      
      console.log(`Processed ${block.type} block:`, cleanBlock);
      return cleanBlock;
    });
    
    console.log('Formatted content blocks:', JSON.stringify(formattedContentBlocks, null, 2));
    
    const postData = {
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
      content: formattedContentBlocks,
    };
    
    console.log('Final post data:', JSON.stringify(postData, null, 2));
    
    const post = new Post(postData);

    try {
      const saved = await post.save();
      console.log('Post saved successfully with ID:', saved._id);
      console.log('Saved content:', JSON.stringify(saved.content, null, 2));
      res.status(201).json(saved);
    } catch (saveError) {
      console.error('Error saving post to database:', saveError);
      return res.status(500).json({ error: "Error saving post to database: " + saveError.message });
    }
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Error while saving post" });
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
    // With multer.any(), files are in an array instead of grouped by field name
    const thumbnailFile = req.files?.find(file => file.fieldname === 'thumbnail');
    if (thumbnailFile) {
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

      console.log("✅ Thumbnail file received for update:", thumbnailFile.originalname);
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
        console.log('Content before parsing:', typeof content, content);
        
        // Handle different content formats
        if (Array.isArray(content)) {
          updatedContent = content;
        } else if (typeof content === 'string') {
          try {
            updatedContent = JSON.parse(content);
            if (!Array.isArray(updatedContent)) {
              console.warn('Content parsed but is not an array:', updatedContent);
              updatedContent = [{ type: 'paragraph', text: content }];
            }
          } catch (parseError) {
            console.warn('Content could not be parsed as JSON, treating as text:', parseError);
            updatedContent = [{ type: 'paragraph', text: content }];
          }
        } else if (typeof content === 'object') {
          // If it's already an object but not an array, wrap it
          updatedContent = [content];
        }
        
        console.log('Content after parsing:', updatedContent);
      } else {
        console.warn("⚠️ No content provided in request")
        updatedContent = post.content || [];
      }
    } catch (error) {
      console.error("Error processing content:", error)
      return res.status(400).json({ error: "Invalid content format: " + error.message })
    }

    // With multer.any(), all files are in an array
    // Get all files except the thumbnail
    const contentImageFiles = req.files?.filter(file => file.fieldname !== 'thumbnail') || [];
    console.log(`Found ${contentImageFiles.length} content image files for update`);    
    
    let imageIndex = 1;
    // Process content blocks with images
    for (let i = 0; i < updatedContent.length; i++) {
      const block = updatedContent[i];
      if (block.type === "image") {
        console.log(`Processing image block for update:`, block);
        
        // Save the old public ID for archiving
        let oldPublicId = block.url;
        if (oldPublicId && oldPublicId.startsWith("http")) {
          oldPublicId = extractCloudinaryPublicId(oldPublicId);
        }
        
        // Check all possible image identifiers
        const imageIdentifier = block.filename || block.src || (block.url && !block.url.startsWith("http") ? block.url : null);
        
        if (imageIdentifier) {
          console.log(`Looking for file with identifier: ${imageIdentifier}`);
          
          // Try to find the file by various matching methods
          let file = contentImageFiles.find(f => 
            f.originalname === imageIdentifier || 
            f.fieldname === imageIdentifier ||
            f.fieldname.includes(imageIdentifier) ||
            (typeof f.originalname === 'string' && imageIdentifier.includes(f.originalname))
          );
          
          // If no exact match, try to find by index if we have files available
          if (!file && contentImageFiles.length > 0 && i < contentImageFiles.length) {
            console.log(`No exact match found, trying to use file at index ${i}`);
            file = contentImageFiles[i];
          }

          if (file) {
            // Archive old image if it exists
            if (oldPublicId && oldPublicId.startsWith("content-images")) {
              const archivePath = oldPublicId.replace("content-images", "archive/content-images");
              try {
                await cloudinary.uploader.rename(oldPublicId, archivePath, { overwrite: true });
                console.log("📁 Archived old content image to:", archivePath);
              } catch (err) {
                console.warn("⚠️ Content image archiving failed or not found:", err.message);
              }
            }

            try {
              console.log(`Found file to upload: ${file.originalname || file.fieldname}`);
              const result = await uploadToCloudinary(
                file.buffer,
                "content-images",
                `${newSlug}-content-${Date.now()}-${imageIndex}`
              );
              
              // Store the Cloudinary public_id in the url field
              updatedContent[i].url = result.public_id;
              
              // Remove filename as it's no longer needed
              delete updatedContent[i].filename;
              delete updatedContent[i].src;
              
              console.log(`✅ Content image uploaded to Cloudinary: ${result.public_id}`);
              imageIndex++;
            } catch (error) {
              console.error("Error uploading content image:", error);
            }
          } else {
            console.warn(`⚠️ Could not find file for image: ${imageIdentifier}`);
          }
        } else if (block.url) {
          // Keep existing image URL if no new file was uploaded
          console.log(`Keeping existing image URL: ${block.url}`);
        } else {
          console.warn(`⚠️ Image block has no filename or URL identifier:`, block);
        }
      }
    }

    // Make sure content blocks match the schema structure and frontend format
    const formattedContentBlocks = updatedContent.map(block => {
      // Ensure each block has the required 'type' field
      if (!block.type) {
        console.warn('Block missing type, defaulting to paragraph:', block);
        block.type = 'paragraph';
      }
      
      // Handle different block types according to frontend format
      let cleanBlock = { type: block.type };
      
      switch (block.type) {
        case 'paragraph':
        case 'heading':
          // For text blocks, use the content or text field
          cleanBlock.text = block.content || block.text || '';
          break;
          
        case 'bulletList':
        case 'orderedList':
          // For list blocks, preserve the content which contains the HTML
          cleanBlock.text = block.content || block.text || '';
          // If there's no content/text but there's HTML content, use that
          if (!cleanBlock.text && block.html) {
            cleanBlock.text = block.html;
          }
          break;
          
        case 'image':
          // For image blocks, preserve the url/src and filename fields
          cleanBlock.url = block.url || block.src || '';
          // Make sure we keep the caption/alt text
          cleanBlock.caption = block.caption || block.alt || '';
          
          console.log('Processing image block for database:', { 
            original: block,
            cleaned: cleanBlock 
          });
          break;
          
        case 'youtube':
          // For YouTube blocks, preserve the videoId
          cleanBlock.url = block.videoId || block.url || '';
          break;
          
        case 'blockquote':
          // For quote blocks
          cleanBlock.text = block.content || block.text || '';
          break;
          
        default:
          // For any other block types, copy all properties
          Object.assign(cleanBlock, block);
      }
      
      // If it's a data object with nested properties, flatten it
      if (block.data) {
        if (block.data.text) cleanBlock.text = block.data.text;
        if (block.data.url) cleanBlock.url = block.data.url;
        if (block.data.caption) cleanBlock.caption = block.data.caption;
        if (block.data.filename) cleanBlock.filename = block.data.filename;
      }
      
      console.log(`Processed ${block.type} block:`, cleanBlock);
      return cleanBlock;
    });

    console.log("✅ Final formatted content:", JSON.stringify(formattedContentBlocks, null, 2));

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
    post.content = formattedContentBlocks
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
    console.log(`🗑️ deletePost endpoint called for post ID: ${id}`);
    
    // Veritabanındaki postu bul
    const post = await Post.findById(id);
    if (!post) {
      console.warn(`⚠️ Post not found with ID: ${id}`);
      return res.status(404).json({ error: "Post not found" });
    }
    
    console.log(`Found post to delete: ${post.title} (${post._id})`);
    let deletedMediaCount = 0;
    let failedMediaCount = 0;
    
    // Cloudinary'deki dosyaları sil
    if (post.thumbnail) {
      try {
        // If thumbnail is already a Cloudinary public_id, use it directly
        const thumbnailPublicId = post.thumbnail.includes('/') ? 
          extractCloudinaryPublicId(post.thumbnail) : post.thumbnail;
        
        console.log(`Deleting thumbnail: ${thumbnailPublicId}`);
        const result = await cloudinary.uploader.destroy(thumbnailPublicId, {
          resource_type: "image",
        });
        
        if (result.result === 'ok') {
          console.log(`✅ Thumbnail deleted successfully: ${thumbnailPublicId}`);
          deletedMediaCount++;
        } else {
          console.warn(`⚠️ Thumbnail deletion returned unexpected result:`, result);
          failedMediaCount++;
        }
      } catch (error) {
        console.error("Error deleting thumbnail:", error);
        failedMediaCount++;
      }
    }

    // İçerik resimlerini sil
    if (post.content && Array.isArray(post.content)) {
      console.log(`Processing ${post.content.length} content blocks for deletion`);
      
      for (let block of post.content) {
        if (block.type === "image") {
          try {
            // Check for url (new format) or data.filename (old format)
            let imagePublicId = null;
            
            if (block.url) {
              // If it's a Cloudinary public_id, use it directly
              imagePublicId = block.url.includes('/') ? 
                extractCloudinaryPublicId(block.url) : block.url;
            } else if (block.data?.filename) {
              imagePublicId = block.data.filename.includes('/') ?
                extractCloudinaryPublicId(block.data.filename) : block.data.filename;
            }
            
            if (imagePublicId) {
              console.log(`Deleting content image: ${imagePublicId}`);
              const result = await cloudinary.uploader.destroy(imagePublicId, {
                resource_type: "image",
              });
              
              if (result.result === 'ok') {
                console.log(`✅ Content image deleted successfully: ${imagePublicId}`);
                deletedMediaCount++;
              } else {
                console.warn(`⚠️ Content image deletion returned unexpected result:`, result);
                failedMediaCount++;
              }
            } else {
              console.warn(`⚠️ Image block has no valid public ID:`, block);
            }
          } catch (error) {
            console.error("Error deleting content image:", error);
            failedMediaCount++;
          }
        }
      }
    }

    // Veritabanından sil
    const deleteResult = await Post.findByIdAndDelete(id);
    if (!deleteResult) {
      console.warn(`⚠️ Post was not found in database during deletion: ${id}`);
    }
    
    console.log(`✅ Post deleted successfully. Media deleted: ${deletedMediaCount}, Failed: ${failedMediaCount}`);

    res.json({
      message: `Post deleted successfully. ${deletedMediaCount} media files removed from Cloudinary.`,
      deletedMediaCount,
      failedMediaCount
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: `Error while deleting post: ${error.message}` });
  }
};
