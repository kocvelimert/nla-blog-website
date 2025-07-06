/**
 * Editor.js - TipTap Editor for No Life Anime
 * 
 * This file contains the content processing functions for the TipTap editor.
 * It handles content block processing and image handling for the editor.
 */

// Global variables for image handling
const imageFilesToUpload = [];

/**
 * Initialize editor functionality when the DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function() {
  // Initialize TipTap editor if present
  initTipTapEditor();
});

/**
 * Initialize TipTap editor
 */
function initTipTapEditor() {
  // Find all editor containers
  const editorContainers = document.querySelectorAll('.content-editable');
  
  if (editorContainers.length === 0) return;
  
  // Initialize each editor container with TipTap
  editorContainers.forEach(container => {
    // Get the parent block to determine editor type
    const parentBlock = container.closest('.content-block');
    const blockType = parentBlock ? parentBlock.dataset.type : 'paragraph';
    
    // Configure editor based on block type
    let editorConfig = {
      element: container,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: getPlaceholderForType(blockType)
        })
      ],
      content: ''
    };
    
    // Add specific extensions based on block type
    if (blockType === 'heading') {
      // Add heading specific extensions
    } else if (blockType === 'image') {
      // Add image specific extensions
    }
    
    // Initialize the editor
    try {
      // This is a placeholder for actual TipTap initialization
      // In a real implementation, you would use: new Editor(editorConfig)
      console.log('TipTap editor initialized for', blockType);
    } catch (error) {
      console.error('Error initializing TipTap editor:', error);
    }
  });
}

/**
 * Get placeholder text based on block type
 * @param {string} blockType - The type of content block
 * @returns {string} Placeholder text
 */
function getPlaceholderForType(blockType) {
  switch (blockType) {
    case 'paragraph':
      return 'Start typing your paragraph...';
    case 'heading':
      return 'Enter heading text...';
    case 'blockquote':
      return 'Enter quote text...';
    default:
      return 'Start typing...';
  }
}

/**
 * Process all content blocks for submission
 * @returns {Array} Array of processed content blocks
 */
function processContentBlocks() {
  try {
    const blocks = document.querySelectorAll(".content-block");
    const processedBlocks = [];
    
    // Clear image files array before processing blocks
    imageFilesToUpload.length = 0;
    
    blocks.forEach(block => {
      try {
        const type = block.dataset.type;
        if (!type) {
          console.warn('Block missing type attribute:', block);
          return;
        }
        
        let processedBlock = null;
        
        switch (type) {
          case "paragraph":
          case "heading":
            processedBlock = processTextBlock(block);
            break;
          case "bulletList":
          case "orderedList":
            processedBlock = processListBlock(block);
            break;
          case "blockquote":
            processedBlock = processQuoteBlock(block);
            break;
          case "image":
            processedBlock = processImageBlock(block);
            break;
          case "youtube":
            processedBlock = processYoutubeBlock(block);
            break;
          default:
            console.warn(`Unknown block type: ${type}`);
        }
        
        if (processedBlock) {
          processedBlocks.push(processedBlock);
        }
      } catch (blockError) {
        console.error('Error processing block:', blockError, block);
      }
    });
    
    return processedBlocks;
  } catch (error) {
    console.error('Error processing content blocks:', error);
    return [];
  }
}

/**
 * Process text blocks (paragraph, heading)
 * @param {HTMLElement} block - The block element to process
 * @returns {Object} Processed block data
 */
function processTextBlock(block) {
  const type = block.dataset.type;
  
  // Look for content in different possible locations
  const contentElement = block.querySelector('.block-content');
  let content = '';
  
  if (contentElement) {
    // Try to find the actual content in different possible elements
    const proseMirror = contentElement.querySelector('.ProseMirror');
    if (proseMirror && proseMirror.innerHTML) {
      content = proseMirror.innerHTML;
      console.log(`Found content in ProseMirror: ${content.substring(0, 50)}...`);
    } else {
      // If ProseMirror element not found, try to get content from the editor element itself
      const editorDiv = contentElement.querySelector('[contenteditable=true]');
      if (editorDiv && editorDiv.innerHTML) {
        content = editorDiv.innerHTML;
        console.log(`Found content in contenteditable: ${content.substring(0, 50)}...`);
      } else {
        // Last resort: get all HTML content from the block-content
        content = contentElement.innerHTML;
        console.log(`Using block-content innerHTML as fallback: ${content.substring(0, 50)}...`);
      }
    }
  }
  
  // If content is still empty, use the default content based on type
  if (!content || content.trim() === '') {
    content = type === 'heading' ? '<h4>Heading</h4>' : '<p>Paragraph text</p>';
    console.log(`Using default content for ${type}: ${content}`);
  }
  
  return { type, content };
}

/**
 * Process list blocks (bullet list, ordered list)
 * @param {HTMLElement} block - The block element to process
 * @returns {Object} Processed block data
 */
function processListBlock(block) {
  const type = block.dataset.type;
  const contentElement = block.querySelector('.block-content');
  let content = '';
  
  if (contentElement) {
    // Try to find the actual content in different possible elements
    const proseMirror = contentElement.querySelector('.ProseMirror');
    if (proseMirror && proseMirror.innerHTML) {
      content = proseMirror.innerHTML;
      console.log(`Found list content in ProseMirror: ${content.substring(0, 50)}...`);
    } else {
      // If ProseMirror element not found, try to get content from the editor element itself
      const editorDiv = contentElement.querySelector('[contenteditable=true]');
      if (editorDiv && editorDiv.innerHTML) {
        content = editorDiv.innerHTML;
        console.log(`Found list content in contenteditable: ${content.substring(0, 50)}...`);
      } else {
        // Last resort: get all HTML content from the block-content
        content = contentElement.innerHTML;
        console.log(`Using block-content innerHTML as fallback for list: ${content.substring(0, 50)}...`);
      }
    }
  }
  
  // If content is still empty, use default content
  if (!content || content.trim() === '') {
    const listTag = type === 'bulletList' ? 'ul' : 'ol';
    content = `<${listTag}><li>List item 1</li></${listTag}>`;
    console.log(`Using default content for ${type}: ${content}`);
  }
  
  return { type, content };
}

/**
 * Process quote blocks
 * @param {HTMLElement} block - The block element to process
 * @returns {Object} Processed block data
 */
function processQuoteBlock(block) {
  const contentElement = block.querySelector('.block-content');
  let content = '';
  
  if (contentElement) {
    // Try to find the actual content in different possible elements
    const proseMirror = contentElement.querySelector('.ProseMirror');
    if (proseMirror && proseMirror.innerHTML) {
      content = proseMirror.innerHTML;
      console.log(`Found quote content in ProseMirror: ${content.substring(0, 50)}...`);
    } else {
      // If ProseMirror element not found, try to get content from the editor element itself
      const editorDiv = contentElement.querySelector('[contenteditable=true]');
      if (editorDiv && editorDiv.innerHTML) {
        content = editorDiv.innerHTML;
        console.log(`Found quote content in contenteditable: ${content.substring(0, 50)}...`);
      } else {
        // Last resort: get all HTML content from the block-content
        content = contentElement.innerHTML;
        console.log(`Using block-content innerHTML as fallback for quote: ${content.substring(0, 50)}...`);
      }
    }
  }
  
  // If content is still empty, use default content
  if (!content || content.trim() === '') {
    content = '<blockquote><p>Quote text</p></blockquote>';
    console.log(`Using default content for blockquote: ${content}`);
  }
  
  return { type: 'blockquote', content };
}

/**
 * Process image blocks
 * @param {HTMLElement} block - The block element to process
 * @returns {Object} Processed block data
 */
function processImageBlock(block) {
  const imagePreview = block.querySelector('.image-preview');
  const img = imagePreview?.querySelector('img');
  let src = '';
  let alt = '';
  
  if (img) {
    src = img.src;
    alt = img.alt || '';
    
    // Check if this is a data URL (newly uploaded image)
    if (src.startsWith('data:')) {
      const filename = `image-${Date.now()}.png`;
      const file = dataURLtoFile(src, filename);
      imageFilesToUpload.push({ file, filename });
      src = filename;
    }
  }
  
  return { type: 'image', src, alt };
}

/**
 * Process YouTube blocks
 * @param {HTMLElement} block - The block element to process
 * @returns {Object} Processed block data
 */
function processYoutubeBlock(block) {
  const input = block.querySelector('.youtube-input');
  const url = input ? input.value : '';
  
  // Return the full URL instead of just the video ID
  return { type: 'youtube', url };
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string} YouTube video ID
 */
function extractYoutubeVideoId(url) {
  if (!url) return '';
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : '';
}

/**
 * Convert data URL to File object
 * @param {string} dataurl - The data URL
 * @param {string} filename - The filename to use
 * @returns {File} The File object
 */
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

// Make functions available globally
window.imageFilesToUpload = imageFilesToUpload;
window.processContentBlocks = processContentBlocks;
window.dataURLtoFile = dataURLtoFile;
window.extractYoutubeVideoId = extractYoutubeVideoId;
