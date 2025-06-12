/**
 * Formats content blocks to match the schema structure and frontend format
 * @param {Array} contentBlocks - The content blocks to format
 * @returns {Array} - The formatted content blocks
 */
const formatContentBlocks = (contentBlocks) => {
  return contentBlocks.map(block => {
    // Ensure each block has the required 'type' field
    if (!block || typeof block !== 'object') {
      console.warn('Invalid block, defaulting to empty paragraph');
      return { type: 'paragraph', text: '' };
    }
    
    if (!block.type) {
      console.warn('Block missing type, defaulting to paragraph:', block);
      block.type = 'paragraph';
    }
    
    // Basic type safety - ensure type is a valid string
    const safeType = typeof block.type === 'string' ? 
      block.type : 'paragraph';
    
    // Handle different block types according to frontend format
    let cleanBlock = { type: safeType };
    
    switch (safeType) {
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
        break;
        
      case 'youtube':
        // For YouTube blocks, preserve the videoId
        // Basic validation for YouTube URLs/IDs
        const ytValue = block.videoId || block.url || '';
        cleanBlock.url = ytValue;
        break;
        
      case 'blockquote':
        // For quote blocks
        cleanBlock.text = block.content || block.text || '';
        break;
        
      default:
        // For any other block types, copy all properties
        // but be selective about which ones we copy
        if (block.text) cleanBlock.text = block.text;
        if (block.url) cleanBlock.url = block.url;
        if (block.caption) cleanBlock.caption = block.caption;
        if (block.content) cleanBlock.content = block.content;
    }
    
    // If it's a data object with nested properties, flatten it
    if (block.data) {
      if (block.data.text) cleanBlock.text = block.data.text;
      if (block.data.url) cleanBlock.url = block.data.url;
      if (block.data.caption) cleanBlock.caption = block.data.caption;
      if (block.data.filename) cleanBlock.filename = block.data.filename;
    }
    
    return cleanBlock;
  }).filter(block => block); // Filter out any null/undefined blocks
};

/**
 * Parses content from various formats into a consistent array structure
 * @param {string|Array|Object} content - The content to parse
 * @param {Array} fallback - Fallback content if parsing fails
 * @returns {Array} - The parsed content as an array of blocks
 */
const parseContent = (content, fallback = []) => {
  try {
    if (!content) {
      return fallback;
    }
    
    // Handle different content formats
    if (Array.isArray(content)) {
      return content;
    } else if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          console.warn('Content parsed but is not an array:', parsed);
          return [{ type: 'paragraph', text: content }];
        }
        return parsed;
      } catch (parseError) {
        console.warn('Content could not be parsed as JSON, treating as text:', parseError);
        return [{ type: 'paragraph', text: content }];
      }
    } else if (typeof content === 'object') {
      // If it's already an object but not an array, wrap it
      return [content];
    }
    
    return fallback;
  } catch (error) {
    console.error("Error processing content:", error);
    return fallback;
  }
};

/**
 * Parses tags from various formats into a consistent array structure
 * @param {string|Array} tags - The tags to parse
 * @returns {Array} - The parsed tags as an array
 */
const parseTags = (tags) => {
  try {
    if (Array.isArray(tags)) return tags;
    
    if (typeof tags === "string") {
      try {
        const parsedTags = JSON.parse(tags);
        if (Array.isArray(parsedTags)) return parsedTags;
        return tags.split(",").map(t => t.trim());
      } catch (error) {
        // If JSON parsing fails, treat as comma-separated string
        return tags.split(",").map(t => t.trim());
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing tags:", error);
    return [];
  }
};

module.exports = {
  formatContentBlocks,
  parseContent,
  parseTags
};
