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
  if (!Array.isArray(contentData) || contentData.length === 0) {
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
  contentData.forEach(block => {
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
    
    console.log(`Processing block of type: ${blockType}`, block);
    
    // Create the appropriate block type
    const blockElement = window.addContentBlock(blockType);
    if (!blockElement) {
      console.warn(`Failed to create block of type: ${blockType}`);
      return;
    }
    
    // Populate the block with content based on its type
    populateBlockContent(blockElement, blockType, block);
  });
}

/**
 * Populate a block with content based on its type
 * @param {HTMLElement} blockElement - The block element to populate
 * @param {string} blockType - The type of block
 * @param {Object} blockData - The block data from the post
 */
function populateBlockContent(blockElement, blockType, blockData) {
  switch (blockType) {
    case 'paragraph':
    case 'heading':
      const editor = blockElement.querySelector('.ProseMirror');
      if (editor) {
        editor.innerHTML = blockData.text || blockData.content || 
          (blockType === 'heading' ? '<h4>Heading</h4>' : '<p>Paragraph text</p>');
      }
      break;
      
    case 'blockquote':
      const quoteEditor = blockElement.querySelector('.ProseMirror');
      if (quoteEditor) {
        quoteEditor.innerHTML = `<blockquote>${blockData.text || ''}</blockquote>`;
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
      const listEditor = blockElement.querySelector('.ProseMirror');
      if (listEditor) {
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
        listEditor.innerHTML = listContent;
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
