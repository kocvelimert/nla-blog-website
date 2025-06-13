import { Editor } from "https://esm.sh/@tiptap/core";
import StarterKit from "https://esm.sh/@tiptap/starter-kit";
import Link from "https://esm.sh/@tiptap/extension-link";
import Placeholder from "https://esm.sh/@tiptap/extension-placeholder";
import TextAlign from "https://esm.sh/@tiptap/extension-text-align";

// Global variables
const contentBlocks = [];
let activeBlock = null;
let sortableInstance = null;

// Add a new content block
window.addContentBlock = function (type) {
  console.log(`Adding content block of type: ${type}`);

  // Get the container
  const container = document.getElementById("blocks-container");
  if (!container) {
    console.error("Blocks container not found!");
    return;
  }

  // Create a unique ID for the block
  const blockId = `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Create the block element
  const blockElement = document.createElement("div");
  blockElement.className = "content-block";
  blockElement.dataset.type = type;
  blockElement.dataset.blockId = blockId;

  // Add drag handle
  const dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  dragHandle.title = "Drag to reorder";
  blockElement.appendChild(dragHandle);

  // Add block type indicator
  const typeIndicator = document.createElement("div");
  typeIndicator.className = "block-type-indicator";
  typeIndicator.textContent = getBlockTypeName(type);
  blockElement.appendChild(typeIndicator);

  // Add delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-block-btn";
  deleteBtn.innerHTML = "×";
  deleteBtn.title = "Delete block";
  deleteBtn.type = "button";
  deleteBtn.onclick = function () {
    blockElement.remove();

    // If no blocks left, add a new paragraph block
    if (container.children.length === 0) {
      addContentBlock("paragraph");
    }
  };
  blockElement.appendChild(deleteBtn);

  // Create content element
  const contentElement = document.createElement("div");
  contentElement.className = "block-content";
  blockElement.appendChild(contentElement);

  // Add to DOM
  container.appendChild(blockElement);

  // Initialize the appropriate editor based on block type
  let blockEditor;

  switch (type) {
    case "paragraph":
    case "heading":
      blockEditor = initTextEditor(contentElement, type);
      break;
    case "bulletList":
    case "orderedList":
      blockEditor = initListEditor(contentElement, type);
      break;
    case "blockquote":
      blockEditor = initQuoteEditor(contentElement);
      break;
    case "image":
      blockEditor = initImageBlock(contentElement);
      break;
    case "youtube":
      blockEditor = initYoutubeBlock(contentElement);
      break;
  }

  // Store block data
  const blockData = {
    id: blockId,
    type: type,
    element: blockElement,
    editor: blockEditor,
    order: contentBlocks.length,
  };

  contentBlocks.push(blockData);

  // Set as active block
  setActiveBlock(blockData);

  // Make blocks sortable
  initSortable();

  console.log(`Added ${type} block with ID ${blockId}`);
  return blockElement;
};

// Initialize Sortable.js for drag-and-drop
function initSortable() {
  const container = document.getElementById("blocks-container");
  if (!container) return;

  // Clear any existing sortable instance
  if (sortableInstance) {
    sortableInstance.destroy();
  }

  sortableInstance = Sortable.create(container, {
    animation: 150,
    handle: ".drag-handle",
    ghostClass: "dragging",
    onEnd: (evt) => {
      // Update the order of blocks in the contentBlocks array
      const blocks = Array.from(container.querySelectorAll(".content-block"));
      blocks.forEach((block, index) => {
        const blockId = block.dataset.blockId;
        const blockData = contentBlocks.find((b) => b.id === blockId);
        if (blockData) {
          blockData.order = index;
        }
      });
    },
  });
}

// Initialize text editor (paragraph, heading)
function initTextEditor(element, type) {
  const placeholder =
    type === "heading" ? "Heading text..." : "Paragraph text...";

  // Set default content based on type
  const defaultContent = type === "heading" ? 
    '<h4>Enter heading here</h4>' : 
    '<p>Enter your text here</p>';

  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({
        heading: type === "heading" ? { levels: [4] } : false,
        paragraph: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      TextAlign.configure({
        types: [type === "heading" ? "heading" : "paragraph"],
      }),
    ],
    content: defaultContent,  // Initialize with default content
    editorProps: {
      attributes: {
        class: `${type}-editor`,
      },
    },
  });

  // Focus the editor and select all text to make it easy to replace
  setTimeout(() => {
    editor.commands.focus();
    editor.commands.selectAll();
  }, 100);

  return editor;
}

// Initialize list editor
function initListEditor(element, type) {
  // Create more detailed default content
  const defaultContent = type === "bulletList"
    ? "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>"
    : "<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>";
    
  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({
        bulletList: type === "bulletList",
        orderedList: type === "orderedList",
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "List items...",
      }),
    ],
    content: defaultContent,
  });

  // Focus the editor and position cursor at end of content
  setTimeout(() => {
    editor.commands.focus('end');
  }, 100);

  return editor;
}

// Initialize quote editor
function initQuoteEditor(element) {
  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({
        blockquote: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Quote text...",
      }),
    ],
    content: "<blockquote>Quote text</blockquote>",
  });

  // Focus the editor
  setTimeout(() => {
    editor.commands.focus();
  }, 100);

  return editor;
}

// Initialize image block
function initImageBlock(element) {
  const container = document.createElement("div");
  container.className = "image-container";

  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/*";
  imageInput.style.display = "none";

  const imagePreview = document.createElement("div");
  imagePreview.className = "image-preview";
  imagePreview.textContent = "Click to add an image";
  imagePreview.onclick = () => imageInput.click();

  container.appendChild(imageInput);
  container.appendChild(imagePreview);
  element.appendChild(container);

  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreview.innerHTML = `<img src="${event.target.result}" alt="Image preview">`;
        imagePreview.className = "image-preview has-image";
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  return null; // No TipTap editor for image blocks
}

// Initialize YouTube block
function initYoutubeBlock(element) {
  const container = document.createElement("div");
  container.className = "youtube-container";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter YouTube URL";
  input.className = "youtube-input";

  const preview = document.createElement("div");
  preview.className = "youtube-preview";

  container.appendChild(input);
  container.appendChild(preview);
  element.appendChild(container);

  input.addEventListener("change", () => {
    const youtubeId = extractYoutubeId(input.value);
    if (youtubeId) {
      preview.innerHTML = `
        <iframe 
          width="560" 
          height="315" 
          src="https://www.youtube.com/embed/${youtubeId}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
        ></iframe>
      `;
    } else {
      preview.innerHTML = "<p>Invalid YouTube URL</p>";
    }
  });

  return null; // No TipTap editor for YouTube blocks
}

// Extract YouTube ID from URL
function extractYoutubeId(url) {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Set active block
function setActiveBlock(blockData) {
  activeBlock = blockData;
  updateToolbarState();
}

// Update toolbar state based on active block
function updateToolbarState() {
  // Reset all buttons
  document.querySelectorAll(".editor-toolbar button").forEach((btn) => {
    btn.classList.remove("is-active");
  });

  if (!activeBlock || !activeBlock.editor) return;

  // Update formatting buttons based on active block
  const editor = activeBlock.editor;

  if (editor.isActive("bold")) {
    document.getElementById("bold-btn").classList.add("is-active");
  }

  if (editor.isActive("italic")) {
    document.getElementById("italic-btn").classList.add("is-active");
  }

  if (editor.isActive("link")) {
    document.getElementById("link-btn").classList.add("is-active");
  }
}

// Get block type name
function getBlockTypeName(type) {
  switch (type) {
    case "paragraph":
      return "Paragraph";
    case "heading":
      return "Heading";
    case "bulletList":
      return "Bullet List";
    case "orderedList":
      return "Ordered List";
    case "blockquote":
      return "Quote";
    case "image":
      return "Image";
    case "youtube":
      return "YouTube";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

// Format text in the active block
window.formatText = function (format, event) {
  // Prevent default behavior to avoid form submission
  if (event) {
    event.preventDefault();
  }
  
  if (!activeBlock || !activeBlock.editor) {
    console.warn("No active block to format");
    return;
  }

  const editor = activeBlock.editor;

  switch (format) {
    case "bold":
      editor.chain().focus().toggleBold().run();
      break;
    case "italic":
      editor.chain().focus().toggleItalic().run();
      break;
    case "link":
      try {
        const url = prompt("Enter URL");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      } catch (error) {
        console.error("Error setting link:", error);
      }
      break;
  }

  updateToolbarState();
  
  // Return false to prevent form submission
  return false;
};

// Find active block when clicking in the editor
document.addEventListener("click", function (e) {
  // Find which block contains the click
  for (const block of contentBlocks) {
    if (block.element && block.element.contains(e.target)) {
      setActiveBlock(block);
      break;
    }
  }
});

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Editor initialized");

  // Create blocks container if it doesn't exist
  const editorElement = document.getElementById("editor");
  if (editorElement) {
    if (!document.getElementById("blocks-container")) {
      const blocksContainer = document.createElement("div");
      blocksContainer.id = "blocks-container";
      blocksContainer.className = "blocks-container";
      editorElement.appendChild(blocksContainer);

      // Add initial paragraph block
      window.addContentBlock("paragraph");
    }
  }

  // Set up text formatting buttons
  document.getElementById("bold-btn").onclick = function (e) {
    e.preventDefault();
    window.formatText("bold");
  };

  document.getElementById("italic-btn").onclick = function (e) {
    e.preventDefault();
    window.formatText("italic");
  };

  document.getElementById("link-btn").onclick = function (e) {
    e.preventDefault();
    window.formatText("link");
  };
});
