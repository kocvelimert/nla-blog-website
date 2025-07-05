const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose")
const Post = require("../models/Post")
const slugify = require("slugify")
const cloudinary = require("cloudinary").v2;

// Import services
const cloudinaryService = require("../services/cloudinaryService")
const contentService = require("../services/contentService")
const imageService = require("../services/imageService")
const mediaService = require("../services/mediaService")
const newsletterService = require("../services/newsletterService")

// Import error handling utilities
const { asyncHandler, createError } = require("../utils/errorHandler")

// GET: Hepsi
exports.getAllPosts = asyncHandler(async (req, res) => {
  console.log("📚 Fetching all posts");
  
  // Only fetch published posts (status: true)
  const posts = await Post.find({ status: true }).lean();
  console.log(`Found ${posts.length} published posts`);

  // Process posts with media URLs using the mediaService
  const postsWithMedia = await mediaService.processPostMedia(posts);

  console.log("✅ Successfully processed all posts with media URLs");
  res.json(postsWithMedia);
});

// GET: Kategoriye göre (with pagination)
exports.getPostsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;
  
  console.log(`📁 Fetching posts for category: ${category}, page: ${page}, limit: ${limit}`);
  
  // Count total posts for this category (only published ones)
  const totalPosts = await Post.countDocuments({
    $or: [{ formatCategory: category }, { contentCategory: category }],
    status: true
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / limit);
  
  console.log(`Found ${totalPosts} total posts in category ${category}, ${totalPages} pages`);
  
  // Get posts for current page (only published ones)
  const posts = await Post.find({
    $or: [{ formatCategory: category }, { contentCategory: category }],
    status: true
  })
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit)
    .lean();
  
  console.log(`Retrieved ${posts.length} posts for current page`);
  
  // Process posts with media URLs using the mediaService
  // We only need thumbnails for category listings, so set processContent to false
  const postsWithMedia = await mediaService.processPostMedia(posts, false);
  
  console.log(`✅ Successfully processed ${postsWithMedia.length} posts with media URLs`);
  
  // Return posts with pagination metadata
  res.json({
    posts: postsWithMedia,
    totalPosts,
    totalPages,
    currentPage: page,
    postsPerPage: limit
  });
});

// GET: Latest posts
exports.getLatestPosts = asyncHandler(async (req, res) => {
  const limit = Number.parseInt(req.query.limit) || 3;
  console.log(`📈 Fetching latest ${limit} posts`);

  const posts = await Post.find({ status: true }).sort({ createdAt: -1 }).limit(limit).lean();
  console.log(`Found ${posts.length} latest posts`);

  // Process posts with media URLs using the mediaService
  // We only need thumbnails for latest posts listings, so set processContent to false
  const processedPosts = await mediaService.processPostMedia(posts, false);

  console.log(`✅ Successfully processed ${processedPosts.length} latest posts`);
  res.json(processedPosts);
});

// GET: Posts by tag
exports.getPostsByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  console.log(`🏷️ Fetching posts with tag: ${tag}, page: ${page}, limit: ${limit}`);

  // Count total posts with this tag
  const totalPosts = await Post.countDocuments({ tags: tag, status: true });

  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / limit);
  
  console.log(`Found ${totalPosts} total posts with tag ${tag}, ${totalPages} pages`);

  // Get posts for current page
  const posts = await Post.find({ tags: tag, status: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log(`Retrieved ${posts.length} posts for current page`);

  // Process posts with media URLs using the mediaService
  // We only need thumbnails for tag listings, so set processContent to false
  const processedPosts = await mediaService.processPostMedia(posts, false);

  console.log(`✅ Successfully processed ${processedPosts.length} posts with tag ${tag}`);
  res.json({
    posts: processedPosts,
    totalPosts,
    totalPages,
    currentPage: page
  });
});

// GET: Popular tags (top 10 most used)
exports.getPopularTags = asyncHandler(async (req, res) => {
  console.log("📊 Fetching popular tags");
  
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

  console.log(`✅ Found ${popularTags.length} popular tags`);
  res.json(popularTags);
});

// GET: Search posts by title
exports.searchPosts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.json([]);
  }

  const searchTerm = q.trim();
  console.log(`🔍 Searching posts for: "${searchTerm}"`);

  // Search only in titles using regex (case-insensitive)
  const posts = await Post.find({
    title: { $regex: searchTerm, $options: 'i' },
    status: true // Only search published posts
  })
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(50) // Limit results to prevent overload
    .lean();

  console.log(`Found ${posts.length} posts matching "${searchTerm}"`);

  // Process posts with media URLs using the mediaService
  // We only need thumbnails for search results, so set processContent to false
  const processedPosts = await mediaService.processPostMedia(posts, false);

  console.log(`✅ Successfully processed ${processedPosts.length} search results`);
  res.json(processedPosts);
});

// GET: Tekil
exports.getPostById = asyncHandler(async (req, res) => {
  console.log(`🔍 Fetching post with ID: ${req.params.id}`);
  
  // Only fetch published posts (status: true)
  const post = await Post.findOne({ _id: req.params.id, status: true }).lean();
  if (!post) {
    console.warn(`⚠️ Post not found or not published with ID: ${req.params.id}`);
    return res.status(404).json({ message: "Post not found or not published" });
  }

  console.log(`Found post: ${post.title} (${post._id})`);
  
  // Process post with media URLs using the mediaService
  // For single post view, we need to process both thumbnail and content images
  const processedPost = await mediaService.processPostMedia(post, true);

  console.log(`✅ Successfully processed post data for: ${processedPost.title}`);
  res.json(processedPost);
});


// POST: Oluşturma
exports.createPost = asyncHandler(async (req, res) => {
  console.log("🚀 createPost endpoint called");
  console.log("req.files:", req.files);
  console.log("req.body:", req.body);

  const { title, formatCategory, contentCategory, tags, status, content, author } = req.body;

  // Title is required
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  // Create slug from title
  const slug = slugify(title, { lower: true });

  // Ensure Cloudinary folders exist
  const folders = ["thumbnails", "content-images"];
  for (const folder of folders) {
    await cloudinaryService.ensureFolderExists(folder);
  }

  // Handle thumbnail upload
  const thumbnailFile = req.files?.find(file => file.fieldname === 'thumbnail');
  
  if (!thumbnailFile) {
    return res.status(400).json({ error: "Thumbnail is required" });
  }
  
  // Upload thumbnail to Cloudinary
  console.log("✅ Thumbnail file received:", thumbnailFile.originalname);
  const thumbnailResult = await cloudinaryService.uploadToCloudinary(
    thumbnailFile.buffer,
    "thumbnails",
    `${slug}-thumbnail-${Date.now()}`
  );
  const thumbnailPublicId = thumbnailResult.public_id;
  console.log("✅ Thumbnail uploaded successfully:", thumbnailPublicId);

  // Parse and process content
  const parsedContent = contentService.parseContent(content);
  
  // Process content images
  const contentImageFiles = req.files?.filter(file => file.fieldname !== 'thumbnail') || [];
  console.log(`Found ${contentImageFiles.length} content image files`);
  
  // Process image blocks in content
  const processedContent = await imageService.processContentImages(
    parsedContent, 
    contentImageFiles, 
    cloudinaryService.uploadToCloudinary,
    slug
  );
  
  // Format content blocks for database storage
  const formattedContentBlocks = contentService.formatContentBlocks(processedContent);
  
  // Parse tags
  const parsedTags = contentService.parseTags(tags);
  
  // Create post data
  const postData = {
    title,
    slug,
    formatCategory: formatCategory || 'Uncategorized',
    contentCategory: contentCategory || 'Uncategorized',
    tags: parsedTags,
    thumbnail: thumbnailPublicId,
    createdAt: new Date(),
    editDates: [],
    author: author || "Anonymous",
    status: status !== undefined ? Boolean(status === "true" || status === true) : true,
    content: formattedContentBlocks,
  };
  
  console.log('Creating post with data:', JSON.stringify({
    title: postData.title,
    slug: postData.slug,
    contentBlockCount: postData.content.length
  }, null, 2));
  
  // Create and save the post
  const post = new Post(postData);
  const saved = await post.save();
  
  console.log(`✅ Post saved successfully with ID: ${saved._id}`);
  
  // Send newsletter campaign if post is published
  if (saved.status) {
    try {
      console.log("📧 Sending newsletter campaign for published post");
      
      // Get the full thumbnail URL for the email
      const thumbnailUrl = await mediaService.getCloudinaryUrl(saved.thumbnail);
      
      // Extract excerpt from content (first text block or first 200 characters)
      let excerpt = "";
      if (saved.content && saved.content.length > 0) {
        const firstTextBlock = saved.content.find(block => block.type === "text" || block.type === "paragraph");
        if (firstTextBlock && firstTextBlock.text) {
          excerpt = firstTextBlock.text.substring(0, 200) + "...";
        }
      }
      
      // Prepare post data for newsletter
      const newsletterPostData = {
        title: saved.title,
        slug: saved.slug,
        excerpt: excerpt,
        thumbnail: thumbnailUrl,
        publishDate: saved.createdAt
      };
      
      // Send newsletter campaign (don't await to avoid blocking the response)
      newsletterService.createPostNotificationCampaign(newsletterPostData)
        .then(result => {
          if (result.success) {
            console.log("✅ Newsletter campaign sent successfully");
          } else {
            console.warn("⚠️ Newsletter campaign failed:", result.message);
          }
        })
        .catch(error => {
          console.error("❌ Newsletter campaign error:", error);
        });
      
    } catch (error) {
      console.error("❌ Newsletter campaign preparation error:", error);
    }
  }
  
  res.status(201).json(saved);
});

// UPDATE: Güncelleme
exports.updatePost = asyncHandler(async (req, res) => {
  console.log("🔧 updatePost endpoint called")
  console.log("req.files:", req.files)
  console.log("req.body:", req.body)

  const { id } = req.params
  const { title, formatCategory, contentCategory, tags, status, content, author } = req.body

  // Find the post
  const post = await Post.findById(id)
  if (!post) {
    return res.status(404).json({ error: "Post not found" })
  }

  // Create new slug if title changed
  const oldSlug = post.slug
  const newSlug = slugify(title || post.title, { lower: true })

  // Ensure Cloudinary folders exist
  const folders = [
    "archive",
    "thumbnails",
    "content-images",
    "archive/thumbnails",
    "archive/content-images",
  ]
  for (const folder of folders) {
    await cloudinaryService.ensureFolderExists(folder)
  }

  // Handle thumbnail update if provided
  let thumbnailPublicId = post.thumbnail
  const thumbnailFile = req.files?.find(file => file.fieldname === 'thumbnail');
  
  if (thumbnailFile) {
    // Archive old thumbnail if it exists
    let oldThumbId = post.thumbnail
    if (oldThumbId && oldThumbId.startsWith("http")) {
      oldThumbId = cloudinaryService.extractCloudinaryPublicId(oldThumbId)
    }

    if (oldThumbId && oldThumbId.startsWith("thumbnails")) {
      try {
        await cloudinaryService.archiveImage(oldThumbId, "thumbnails")
      } catch (err) {
        console.warn("⚠️ Thumbnail archiving failed or not found:", err.message)
      }
    }

    // Upload new thumbnail
    console.log("✅ Thumbnail file received for update:", thumbnailFile.originalname);
    const result = await cloudinaryService.uploadToCloudinary(
      thumbnailFile.buffer,
      "thumbnails",
      `${newSlug}-thumbnail-${Date.now()}`
    )
    thumbnailPublicId = result.public_id
    console.log("✅ Thumbnail uploaded successfully:", result.public_id)
  }

  // Parse content from request or use existing content
  const updatedContent = contentService.parseContent(content, post.content || []);

  // Process content images
  const contentImageFiles = req.files?.filter(file => file.fieldname !== 'thumbnail') || [];
  console.log(`Found ${contentImageFiles.length} content image files for update`);    
  
  // Process image blocks in content
  const processedContent = await imageService.processContentImages(
    updatedContent, 
    contentImageFiles, 
    cloudinaryService.uploadToCloudinary,
    newSlug,
    cloudinaryService.archiveImage
  );
  
  // Format content blocks for database storage
  const formattedContentBlocks = contentService.formatContentBlocks(processedContent);
  
  // Parse tags
  const parsedTags = contentService.parseTags(tags);
  
  // Update post data
  post.title = title || post.title;
  post.slug = newSlug;
  post.formatCategory = formatCategory || post.formatCategory;
  post.contentCategory = contentCategory || post.contentCategory;
  post.tags = parsedTags;
  post.status = Boolean(status === "true" || status === true);
  post.content = formattedContentBlocks;
  post.thumbnail = thumbnailPublicId;
  post.author = author || post.author;
  post.editDates = [...(post.editDates || []), new Date().toISOString()];

  const updatedPost = await post.save();
  res.status(200).json({ message: "Post updated successfully", post: updatedPost });
});


// DELETE: Silme
exports.deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ deletePost endpoint called for post ID: ${id}`);
  
  // Find the post in the database
  const post = await Post.findById(id);
  if (!post) {
    console.warn(`⚠️ Post not found with ID: ${id}`);
    return res.status(404).json({ error: "Post not found" });
  }
  
  console.log(`Found post to delete: ${post.title} (${post._id})`);
  let deletedMediaCount = 0;
  let failedMediaCount = 0;
  
  // Delete thumbnail from Cloudinary if it exists
  if (post.thumbnail) {
    try {
      // If thumbnail is already a Cloudinary public_id, use it directly
      const thumbnailPublicId = post.thumbnail.includes('/') ? 
        cloudinaryService.extractCloudinaryPublicId(post.thumbnail) : post.thumbnail;
      
      console.log(`Deleting thumbnail: ${thumbnailPublicId}`);
      const result = await cloudinaryService.deleteImage(thumbnailPublicId);
      
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

  // Delete content images from Cloudinary if they exist
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
              cloudinaryService.extractCloudinaryPublicId(block.url) : block.url;
          } else if (block.data?.filename) {
            imagePublicId = block.data.filename.includes('/') ?
              cloudinaryService.extractCloudinaryPublicId(block.data.filename) : block.data.filename;
          }
          
          if (imagePublicId) {
            console.log(`Deleting content image: ${imagePublicId}`);
            const result = await cloudinaryService.deleteImage(imagePublicId);
            
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

  // Delete post from database
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
});
