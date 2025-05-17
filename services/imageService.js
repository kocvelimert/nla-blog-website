const cloudinaryService = require('./cloudinaryService');

/**
 * Finds an image file in an array of files based on various identifiers
 * @param {Array} files - Array of file objects
 * @param {Object} block - Content block containing image identifiers
 * @param {number} index - Index of the block in the content array
 * @returns {Object|null} - The found file or null if not found
 */
const findImageFile = (files, block, index) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.warn('No files provided to findImageFile function');
    return null;
  }
  
  // Extract all possible identifiers from the block
  const imageIdentifier = block.filename || block.src || 
    (block.url && !block.url.startsWith("http") ? block.url : null);
  
  if (!imageIdentifier) {
    console.warn(`No identifier found in image block:`, block);
    return null;
  }
  
  console.log(`Looking for file with identifier: ${imageIdentifier}`);
  
  // Try to find the file by various matching methods
  let file = files.find(f => 
    f.originalname === imageIdentifier || 
    f.fieldname === imageIdentifier ||
    f.fieldname.includes(imageIdentifier) ||
    (typeof f.originalname === 'string' && imageIdentifier.includes(f.originalname))
  );
  
  // If no exact match, try to find by index if we have files available
  if (!file && files.length > 0 && index < files.length) {
    console.log(`No exact match found, trying to use file at index ${index}`);
    file = files[index];
  }
  
  return file;
};

/**
 * Processes content blocks with images, uploading new images and updating block URLs
 * @param {Array} contentBlocks - Array of content blocks
 * @param {Array} files - Array of uploaded files
 * @param {Function} uploadFunction - Function to upload files
 * @param {string} slug - Slug to use in the filename
 * @param {Function} archiveFunction - Function to archive old images
 * @returns {Promise<Array>} - Updated content blocks with new image URLs
 */
const processContentImages = async (contentBlocks, files, uploadFunction, slug, archiveFunction) => {
  if (!contentBlocks || !Array.isArray(contentBlocks)) {
    return [];
  }
  
  const imageFiles = files || [];
  console.log(`Processing ${contentBlocks.length} content blocks with ${imageFiles.length} image files`);
  
  let imageIndex = 1;
  const updatedBlocks = [...contentBlocks];
  
  for (let i = 0; i < updatedBlocks.length; i++) {
    const block = updatedBlocks[i];
    
    if (block.type === "image") {
      console.log(`Processing image block at index ${i}:`, block);
      
      // Save the old public ID for archiving
      let oldPublicId = block.url;
      if (oldPublicId && oldPublicId.startsWith("http") && archiveFunction) {
        try {
          // Extract public ID from URL if needed
          oldPublicId = cloudinaryService.extractCloudinaryPublicId(oldPublicId);
          
          // Archive old image if it exists and starts with the correct folder
          if (oldPublicId && oldPublicId.startsWith("content-images")) {
            await archiveFunction(oldPublicId, "content-images");
          }
        } catch (err) {
          console.warn(`⚠️ Error archiving old image: ${err.message}`);
        }
      }
      
      // Find the file for this image block
      const file = findImageFile(imageFiles, block, i);
      
      if (file) {
        try {
          console.log(`Found file to upload: ${file.originalname || file.fieldname}`);
          const result = await uploadFunction(
            file.buffer,
            "content-images",
            `${slug}-content-${Date.now()}-${imageIndex}`
          );
          
          // Store the Cloudinary public_id in the url field
          updatedBlocks[i].url = result.public_id;
          
          // Remove filename as it's no longer needed
          delete updatedBlocks[i].filename;
          delete updatedBlocks[i].src;
          
          console.log(`✅ Content image uploaded: ${result.public_id}`);
          imageIndex++;
        } catch (error) {
          console.error("Error uploading content image:", error);
        }
      } else if (block.url) {
        // Keep existing image URL if no new file was uploaded
        console.log(`Keeping existing image URL: ${block.url}`);
      } else {
        console.warn(`⚠️ Image block has no filename or URL identifier:`, block);
      }
    }
  }
  
  return updatedBlocks;
};

module.exports = {
  findImageFile,
  processContentImages
};
