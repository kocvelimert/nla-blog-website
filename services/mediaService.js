const cloudinary = require('cloudinary').v2;

/**
 * Process post thumbnails and content images with Cloudinary URLs
 * @param {Array|Object} posts - Single post object or array of posts
 * @param {boolean} processContent - Whether to process content images (default: true)
 * @returns {Promise<Array|Object>} - Posts with processed media URLs
 */
const processPostMedia = async (posts, processContent = true) => {
  // Handle both single post and array of posts
  const isArray = Array.isArray(posts);
  const postsArray = isArray ? posts : [posts];
  
  const processedPosts = await Promise.all(
    postsArray.map(async (post) => {
      // Skip if post is null or undefined
      if (!post) return post;
      
      // Create a copy of the post to avoid mutating the original
      const processedPost = { ...post };
      
      // Process thumbnail URL
      if (processedPost.thumbnail) {
        try {
          const thumbnailUrl = cloudinary.url(processedPost.thumbnail, {
            resource_type: "image",
            width: 600,
            height: 400,
            crop: "fill",
            quality: "auto:best",
            fetch_format: "auto",
            dpr: "auto",
            flags: "progressive",
          });
          processedPost.thumbnail = thumbnailUrl;
        } catch (error) {
          console.warn(`⚠️ Error processing thumbnail URL for post ${processedPost._id}: ${error.message}`);
          // Keep original thumbnail value if URL generation fails
        }
      }

      // Process content images if requested
      if (processContent && processedPost.content && Array.isArray(processedPost.content)) {
        processedPost.content = await Promise.all(
          processedPost.content.map(async (block) => {
            if (block.type === "image") {
              try {
                // Handle both new format (url) and old format (data.filename)
                const imageId = block.url || (block.data?.filename);
                
                if (imageId) {
                  const imageUrl = cloudinary.url(imageId, {
                    resource_type: "image",
                    width: 800,
                    height: 600,
                    crop: "fill",
                    quality: "auto:best",
                    fetch_format: "auto",
                    dpr: "auto",
                    flags: "progressive",
                  });
                  
                  // Update the appropriate field based on format
                  if (block.url) {
                    block.url = imageUrl;
                  } else if (block.data?.filename) {
                    block.data.filename = imageUrl;
                  }
                }
              } catch (error) {
                console.warn(`⚠️ Error processing content image URL: ${error.message}`);
                // Keep original values if URL generation fails
              }
            }
            return block;
          })
        );
      }

      return processedPost;
    })
  );

  // Return in the same format as input (array or single object)
  return isArray ? processedPosts : processedPosts[0];
};

/**
 * Process a single image URL with Cloudinary transformations
 * @param {string} imageId - Cloudinary public ID of the image
 * @param {Object} options - Custom options for the transformation
 * @returns {string} - Transformed Cloudinary URL
 */
const processImageUrl = (imageId, options = {}) => {
  if (!imageId) return null;
  
  try {
    // Default options
    const defaultOptions = {
      resource_type: "image",
      width: 800,
      height: 600,
      crop: "fill",
      quality: "auto:best",
      fetch_format: "auto",
      dpr: "auto",
      flags: "progressive",
    };
    
    // Merge default options with custom options
    const transformOptions = { ...defaultOptions, ...options };
    
    return cloudinary.url(imageId, transformOptions);
  } catch (error) {
    console.warn(`⚠️ Error processing image URL for ${imageId}: ${error.message}`);
    return imageId; // Return original ID if processing fails
  }
};

module.exports = {
  processPostMedia,
  processImageUrl
};
