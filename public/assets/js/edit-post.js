/**
 * Edit Post JS - TipTap Editor Implementation
 * Handles post editing functionality with the TipTap editor
 */

// Configuration constants
const API_URL = "http://localhost:3000";
const CLOUDINARY_IMG_DIRECTORY = "https://res.cloudinary.com/dpwktwbzk/image/upload/v1745195684";
const postId = new URLSearchParams(window.location.search).get("id");

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (!postId) {
    alert('Error: No post ID provided');
    return;
  }
  
  setupThumbnailPreview();
  setupFormSubmission();
  fetchPostData();
});

/**
 * Fetch post data from the API and populate the form
 */
function fetchPostData() {
  fetch(`${API_URL}/posts/${postId}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(populateFormFields)
    .catch(error => {
      console.error('Error loading post:', error);
      alert(`Failed to load post data: ${error.message}`);
    });
}

/**
 * Populate form fields with post data
 * @param {Object} post - The post data object
 */
function populateFormFields(post) {
  // Set basic form fields
  document.getElementById("editTitle").value = post.title || '';
  document.getElementById("editAuthor").value = post.author || '';
  document.getElementById("editFormatCategory").value = post.formatCategory || '';
  document.getElementById("editContentCategory").value = post.contentCategory || '';
  
  // Set tags (comma-separated)
  setTagsField(post.tags);
  
  // Set thumbnail preview
  setThumbnailPreview(post.thumbnail);
  
  // Create content blocks based on post content
  createContentBlocksFromData(post.content);
}

/**
 * Set tags field value handling different possible formats
 * @param {Array|string} tags - Tags data from the post
 */
function setTagsField(tags) {
  if (!tags) return;
  
  let tagsValue = '';
  
  if (Array.isArray(tags)) {
    tagsValue = tags.join(', ');
  } else if (typeof tags === 'string') {
    try {
      const parsedTags = JSON.parse(tags);
      tagsValue = Array.isArray(parsedTags) ? parsedTags.join(', ') : tags;
    } catch (e) {
      tagsValue = tags;
    }
  }
  
  document.getElementById("editTags").value = tagsValue;
}

/**
 * Set thumbnail preview from post data
 * @param {string} thumbnailUrl - URL of the post thumbnail
 */
function setThumbnailPreview(thumbnailUrl) {
  const thumbnailPreview = document.getElementById("thumbnail-preview");
  if (!thumbnailUrl || !thumbnailPreview) return;
  
  thumbnailPreview.src = thumbnailUrl;
  thumbnailPreview.style.display = "block";
  
  const container = document.getElementById("editThumbnail").closest('.thumbnail-uploader');
  if (container) container.classList.add('has-image');
}

/**
 * Create content blocks from post data
 * @param {Array} contentData - The content blocks data from the post
 */
function createContentBlocksFromData(contentData) {
  console.log('Creating content blocks from data:', contentData);
  
  if (!Array.isArray(contentData) || contentData.length === 0) {
    console.log('No content data found, creating default paragraph block');
    window.addContentBlock('paragraph');
    return;
  }
  
  // Clear any existing blocks first
  const blocksContainer = document.getElementById('blocks-container');
  if (!blocksContainer) {
    console.error('Blocks container not found');
    return;
  }
  
  blocksContainer.innerHTML = '';
  
  // Process each content block
  contentData.forEach((block, index) => {
    console.log(`Processing block ${index}:`, block);
    
    // Map old block types to new block types
    let blockType = block.type;
    
    // Handle different naming conventions between old and new editor
    if (blockType === 'quote') {
      blockType = 'blockquote';
    } else if (blockType === 'list' || blockType === 'bullet-list') {
      blockType = 'bulletList';
    } else if (blockType === 'ordered-list' || blockType === 'numbered-list') {
      blockType = 'orderedList';
    }
    
    console.log(`Processing block ${index} of type: ${blockType}`, block);
    
    // Create the appropriate block type
    const blockElement = window.addContentBlock(blockType);
    if (!blockElement) {
      console.warn(`Failed to create block of type: ${blockType}`);
      return;
    }
    
    // Add a delay to ensure the block and TipTap editor are fully initialized before populating
    setTimeout(() => {
      populateBlockContent(blockElement, blockType, block);
    }, 500 + (100 * index)); // Give even more time for TipTap initialization and stagger the population
  });
}

/**
 * Helper function to set content via innerHTML as fallback
 * @param {HTMLElement} blockElement - The block element
 * @param {string} content - The content to set
 * @param {string} blockType - The block type
 */
function setContentViaInnerHTML(blockElement, content, blockType) {
  const proseMirrorElement = blockElement.querySelector('.ProseMirror');
  if (proseMirrorElement) {
    const finalContent = content || (blockType === 'heading' ? '<h4>Heading</h4>' : '<p>Paragraph text</p>');
    proseMirrorElement.innerHTML = finalContent;
    console.log(`Set content via innerHTML for ${blockType}:`, finalContent.substring(0, 50) + '...');
  }
}

/**
 * Populate a block with content based on its type
 * @param {HTMLElement} blockElement - The block element to populate
 * @param {string} blockType - The type of block
 * @param {Object} blockData - The block data from the post
 */
function populateBlockContent(blockElement, blockType, blockData) {
  console.log(`Populating ${blockType} block with data:`, blockData);
  
  switch (blockType) {
    case 'paragraph':
    case 'heading':
      // Find the TipTap editor instance for this block
      const blockId = blockElement.dataset.blockId;
      
      // Get the content from blockData
      let content = '';
      if (blockData.content) {
        content = blockData.content;
      } else if (blockData.text) {
        content = blockData.text;
      } else if (blockData.data && blockData.data.text) {
        content = blockData.data.text;
      } else if (blockData.data && blockData.data.content) {
        content = blockData.data.content;
      }
      
      console.log(`Setting ${blockType} content:`, content);
      
      // Find the editor instance in the global contentBlocks array
      if (window.contentBlocks && window.contentBlocks.length > 0) {
        console.log(`Looking for block ${blockId} in contentBlocks array with ${window.contentBlocks.length} blocks`);
        const blockData_editor = window.contentBlocks.find(block => block.id === blockId);
        
        if (blockData_editor && blockData_editor.editor) {
          console.log(`Found TipTap editor for block ${blockId}, setting content`);
          // Use TipTap's setContent method to properly set the content
          try {
            const finalContent = content || (blockType === 'heading' ? '<h4>Heading</h4>' : '<p>Paragraph text</p>');
            blockData_editor.editor.commands.setContent(finalContent);
            console.log(`✅ Successfully set content for ${blockType} block using TipTap API`);
          } catch (error) {
            console.warn(`❌ Failed to set content using TipTap API, falling back to innerHTML:`, error);
            // Fallback to innerHTML method
            setContentViaInnerHTML(blockElement, content, blockType);
          }
        } else {
          console.warn(`❌ No TipTap editor instance found for block ${blockId} (found block: ${!!blockData_editor}, has editor: ${!!(blockData_editor && blockData_editor.editor)})`);
          // Try again after a short delay
          setTimeout(() => {
            populateBlockContent(blockElement, blockType, { content, text: content });
          }, 500);
        }
      } else {
        console.warn(`❌ contentBlocks not available or empty (exists: ${!!window.contentBlocks}, length: ${window.contentBlocks ? window.contentBlocks.length : 'N/A'})`);
        // Try again after a short delay
        setTimeout(() => {
          populateBlockContent(blockElement, blockType, { content, text: content });
        }, 500);
      }
      break;
      
    case 'blockquote':
      // Find the TipTap editor instance for this quote block
      const quoteBlockId = blockElement.dataset.blockId;
      
      // Get the raw content
      let rawQuoteContent = blockData.text || blockData.content || '';
      
      // Check if content already contains blockquote tags to avoid nesting
      let quoteContent;
      if (rawQuoteContent.includes('<blockquote>')) {
        // Content already has blockquote tags, use as-is
        quoteContent = rawQuoteContent;
      } else {
        // Content doesn't have blockquote tags, wrap it
        quoteContent = `<blockquote>${rawQuoteContent}</blockquote>`;
      }
      
      console.log(`Setting quote content:`, quoteContent);
      
      // Find the editor instance and use TipTap API
      if (window.contentBlocks && window.contentBlocks.length > 0) {
        const quoteBlockData = window.contentBlocks.find(block => block.id === quoteBlockId);
        if (quoteBlockData && quoteBlockData.editor) {
          try {
            quoteBlockData.editor.commands.setContent(quoteContent);
            console.log(`✅ Successfully set quote content using TipTap API`);
          } catch (error) {
            console.warn(`❌ Failed to set quote content using TipTap API, falling back to innerHTML:`, error);
            setContentViaInnerHTML(blockElement, quoteContent, 'blockquote');
          }
        } else {
          console.warn(`❌ No TipTap editor found for quote block ${quoteBlockId}, retrying...`);
          // Try again after a short delay
          setTimeout(() => {
            populateBlockContent(blockElement, blockType, blockData);
          }, 500);
        }
      } else {
        console.warn(`❌ contentBlocks not available for quote block, retrying...`);
        // Try again after a short delay
        setTimeout(() => {
          populateBlockContent(blockElement, blockType, blockData);
        }, 500);
      }
      break;
      
    case 'image':
      const imagePreview = blockElement.querySelector('.image-preview');
      if (imagePreview && blockData.url) {
        // Construct the full image URL with the Cloudinary directory path
        const imageUrl = blockData.url.startsWith('http') ? 
          blockData.url : // Use as is if it's already a full URL
          `${CLOUDINARY_IMG_DIRECTORY}/${blockData.url}`; // Otherwise prepend the Cloudinary path
        
        imagePreview.innerHTML = `<img src="${imageUrl}" alt="Image">`;
        imagePreview.className = 'image-preview has-image';
      }
      break;
      
    case 'youtube':
      const youtubeInput = blockElement.querySelector('.youtube-input');
      const youtubePreview = blockElement.querySelector('.youtube-preview');
      
      if (youtubeInput && youtubePreview && blockData.url) {
        youtubeInput.value = blockData.url;
        
        const videoId = extractYoutubeId(blockData.url);
        if (videoId) {
          youtubePreview.innerHTML = `
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/${videoId}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          `;
        }
      }
      break;
      
    case 'bulletList':
    case 'orderedList':
      // Find the TipTap editor instance for this list block
      const listBlockId = blockElement.dataset.blockId;
      const listType = blockType === 'bulletList' ? 'ul' : 'ol';
      
      // Handle different possible list content formats
      let listContent = '';
      
      if (blockData.content) {
        // If content is already in HTML format, use it directly
        listContent = blockData.content;
      } else if (blockData.items && Array.isArray(blockData.items)) {
        // If content is provided as an array of items
        listContent = `<${listType}>${blockData.items.map(item => `<li>${item}</li>`).join('')}</${listType}>`;
      } else if (blockData.text) {
        // If content is provided as a single text string, try to parse it as list items
        const items = blockData.text.split('\n').filter(item => item.trim());
        listContent = `<${listType}>${items.map(item => `<li>${item}</li>`).join('')}</${listType}>`;
      } else {
        // Default empty list
        listContent = `<${listType}><li>List item</li></${listType}>`;
      }
      
      console.log(`Setting list content for ${blockType}:`, listContent);
      
      // Find the editor instance and use TipTap API
      if (window.contentBlocks && window.contentBlocks.length > 0) {
        const listBlockData = window.contentBlocks.find(block => block.id === listBlockId);
        if (listBlockData && listBlockData.editor) {
          try {
            listBlockData.editor.commands.setContent(listContent);
            console.log(`✅ Successfully set list content using TipTap API`);
          } catch (error) {
            console.warn(`❌ Failed to set list content using TipTap API, falling back to innerHTML:`, error);
            setContentViaInnerHTML(blockElement, listContent, blockType);
          }
        } else {
          console.warn(`❌ No TipTap editor found for list block ${listBlockId}, retrying...`);
          // Try again after a short delay
          setTimeout(() => {
            populateBlockContent(blockElement, blockType, blockData);
          }, 500);
        }
      } else {
        console.warn(`❌ contentBlocks not available for list block, retrying...`);
        // Try again after a short delay
        setTimeout(() => {
          populateBlockContent(blockElement, blockType, blockData);
        }, 500);
      }
      break;
  }
}

/**
 * Set up thumbnail preview functionality
 */
function setupThumbnailPreview() {
  const thumbnailInput = document.getElementById('editThumbnail');
  const thumbnailPreview = document.getElementById('thumbnail-preview');
  
  if (!thumbnailInput || !thumbnailPreview) return;
  
  thumbnailInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        thumbnailPreview.src = e.target.result;
        thumbnailPreview.style.display = 'block';
        
        const container = thumbnailInput.closest('.thumbnail-uploader');
        if (container) container.classList.add('has-image');
      };
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Set up form submission handler
 */
function setupFormSubmission() {
  const form = document.getElementById('editPostForm');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    updatePost();
  });
}

/**
 * Update the post with form data
 */
function updatePost() {
  // Process tags
  const tagsInput = document.getElementById('editTags').value;
  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  // Process content blocks
  const contentBlocks = window.processContentBlocks ? window.processContentBlocks() : [];
  
  // Create form data
  const formData = new FormData();
  
  // Append basic fields
  formData.append('title', document.getElementById('editTitle').value);
  formData.append('formatCategory', document.getElementById('editFormatCategory').value);
  formData.append('contentCategory', document.getElementById('editContentCategory').value);
  formData.append('author', document.getElementById('editAuthor').value);
  formData.append('status', true);
  formData.append('tags', JSON.stringify(tags));
  formData.append('content', JSON.stringify(contentBlocks));
  
  // Add thumbnail if provided
  const thumbnailInput = document.getElementById('editThumbnail');
  if (thumbnailInput?.files.length > 0) {
    formData.append('thumbnail', thumbnailInput.files[0]);
  }
  
  // Add image files from content blocks
  if (window.imageFilesToUpload?.length > 0) {
    const imageFilenames = [];
    
    window.imageFilesToUpload.forEach(item => {
      if (item.file && item.filename) {
        formData.append('images', item.file, item.filename);
        imageFilenames.push(item.filename);
      }
    });
    
    formData.append('imageFilenames', JSON.stringify(imageFilenames));
  }
  
  // Send PATCH request to update the post
  fetch(`${API_URL}/posts/${postId}`, {
    method: 'PATCH',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(() => {
    alert('Post updated successfully!');
    window.location.href = 'admin-page.html';
  })
  .catch(error => {
    console.error('Error updating post:', error);
    alert(`Error updating post: ${error.message}`);
  });
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - The YouTube URL
 * @returns {string|null} - The extracted video ID or null if invalid
 */
function extractYoutubeId(url) {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}
