/**
 * Post Management System for No Life Anime
 * 
 * This file handles post listing, editing, deleting, and status management.
 * Content creation functionality is in editor.js
 */

// URL for the API (ensure it's correct for your backend setup)
const API_URL = "http://localhost:3000";

/**
 * Initialize the post management system when the DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function() {
  // Load posts if we're on the admin page
  if (document.getElementById("posts-list")) {
    fetchPosts();
  }
});


/**
 * Toggle post status (published/hidden)
 * @param {string} postId - The ID of the post to toggle
 * @param {boolean} newStatus - The new status value
 * @param {HTMLElement} statusText - The status text element to update
 */
function toggleStatus(postId, newStatus, statusText) {
  fetch(`${API_URL}/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((response) => response.json())
    .then((updatedPost) => {
      console.log(
        `Post ${updatedPost.id} status is now ${updatedPost.status ? "Published" : "Hidden"}`
      );
      // Update the status text
      statusText.textContent = updatedPost.status ? "Published" : "Hidden";
    })
    .catch((error) => {
      console.error("Error updating status:", error);
      alert("Failed to update post status.");
    });
}

/**
 * Fetch and display all posts
 */
function fetchPosts() {
  fetch(API_URL + "/posts")
    .then((response) => response.json())
    .then((posts) => {
      const postsList = document.getElementById("posts-list");
      if (!postsList) return;
      
      postsList.innerHTML = ""; // Clear existing posts

      posts.forEach((post) => {
        const tr = document.createElement("tr");

        // ID
        const tdId = document.createElement("td");
        tdId.textContent = post._id;
        tr.appendChild(tdId);

        // Title
        const tdTitle = document.createElement("td");
        tdTitle.textContent = post.title;
        tr.appendChild(tdTitle);

        // Format Category
        const tdFormatC = document.createElement("td");
        tdFormatC.textContent = post.formatCategory;
        tr.appendChild(tdFormatC);

        // Content Category
        const tdContentC = document.createElement("td");
        tdContentC.textContent = post.contentCategory;
        tr.appendChild(tdContentC);

        // Status (Published/Hidden) + Checkbox
        const tdStatus = document.createElement("td");

        // Create checkbox
        const statusCheckbox = document.createElement("input");
        statusCheckbox.type = "checkbox";
        statusCheckbox.checked = post.status;
        statusCheckbox.classList.add("status-toggle");

        // Create text element for status
        const statusText = document.createElement("span");
        statusText.textContent = post.status ? "Published" : "Hidden";

        // Append checkbox and text to the status cell
        tdStatus.appendChild(statusCheckbox);
        tdStatus.appendChild(statusText);

        // Update status text when checkbox is toggled
        statusCheckbox.addEventListener("change", () => {
          const newStatus = statusCheckbox.checked;
          // Show confirmation alert
          const confirmation = confirm(
            `Are you sure you want to mark this post as ${newStatus ? "Published" : "Hidden"}?`
          );

          if (confirmation) {
            toggleStatus(post._id, newStatus, statusText);
          } else {
            // If the user cancels, revert the checkbox to its original state
            statusCheckbox.checked = !newStatus;
          }
        });

        tr.appendChild(tdStatus);

        // Actions (Edit and Delete)
        const tdActions = document.createElement("td");

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("update-post-btn");
        editBtn.onclick = () => editPost(post._id);
        tdActions.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deletePost(post._id);
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdActions);
        postsList.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
    });
}

/**
 * Toggle post status (published/hidden)
 * @param {string} postId - The ID of the post to toggle
 * @param {boolean} newStatus - The new status value
 * @param {HTMLElement} statusText - The status text element to update
 */
function toggleStatus(postId, newStatus, statusText) {
  fetch(`${API_URL}/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((response) => response.json())
    .then((updatedPost) => {
      console.log(
        `Post ${updatedPost.id} status is now ${updatedPost.status ? "Published" : "Hidden"}`
      );
      // Update the status text
      statusText.textContent = updatedPost.status ? "Published" : "Hidden";
    })
    .catch((error) => {
      console.error("Error updating status:", error);
      alert("Failed to update post status.");
    });
}

// Function to fetch and display all posts
function fetchPosts() {
  fetch(API_URL + "/posts")
    .then((response) => response.json())
    .then((posts) => {
      const postsList = document.getElementById("posts-list");
      postsList.innerHTML = ""; // Clear existing posts

      posts.forEach((post) => {
        const tr = document.createElement("tr");

        // ID
        const tdId = document.createElement("td");
        tdId.textContent = post._id;
        tr.appendChild(tdId);

        // Title
        const tdTitle = document.createElement("td");
        tdTitle.textContent = post.title;
        tr.appendChild(tdTitle);

        // Format Cat
        const tdFormatC = document.createElement("td");
        tdFormatC.textContent = post.formatCategory;
        tr.appendChild(tdFormatC);

        // Content Cat
        const tdContentC = document.createElement("td");
        tdContentC.textContent = post.contentCategory;
        tr.appendChild(tdContentC);

        // Status (Published/Hidden) + Checkbox
        // Status (Checkbox with text change)
        const tdStatus = document.createElement("td");

        // Create checkbox
        const statusCheckbox = document.createElement("input");
        statusCheckbox.type = "checkbox";
        statusCheckbox.checked = post.status;
        statusCheckbox.classList.add("status-toggle");

        // Create text element for status
        const statusText = document.createElement("span");
        statusText.textContent = post.status ? "Published" : "Hidden";

        // Append checkbox and text to the status cell
        tdStatus.appendChild(statusCheckbox);
        tdStatus.appendChild(statusText);

        // Update status text when checkbox is toggled
        statusCheckbox.addEventListener("change", () => {
          const newStatus = statusCheckbox.checked;
          // Show confirmation alert
          const confirmation = confirm(
            `Are you sure you want to mark this post as ${
              newStatus ? "Published" : "Hidden"
            }?`
          );

          if (confirmation) {
            toggleStatus(post._id, newStatus, statusText);
          } else {
            // If the user cancels, revert the checkbox to its original state
            statusCheckbox.checked = !newStatus;
          }
        });

        tr.appendChild(tdStatus);

        // Actions (Edit and Delete)
        const tdActions = document.createElement("td");

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("update-post-btn");
        editBtn.onclick = () => editPost(post._id);
        tdActions.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deletePost(post._id);
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdActions);
        postsList.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
    });
}

// Function to edit a post
function editPost(postId) {
  window.location.href = `admin-editpost.html?id=${postId}`;
}

// Function to delete a post
function deletePost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    fetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((result) => {
        alert("Post deleted successfully!");
        fetchPosts(); // Re-fetch posts to update the list
      })
      .catch((error) => {
        console.error("Error deleting post:", error);
        alert("Failed to delete post.");
      });
  }
}

// Call fetchPosts to load posts when the page is ready
document.addEventListener("DOMContentLoaded", function() {
  console.log('DOM loaded - initializing app.js functionality');
  
  // Initialize post list if we're on the admin page
  if (document.getElementById("posts-list")) {
    fetchPosts();
  }
  
  // Initialize thumbnail preview functionality if on the new post or edit post page
  const thumbnailInput = document.getElementById("thumbnail");
  if (thumbnailInput) {
    console.log('Thumbnail input found, setting up preview functionality');
    
    thumbnailInput.addEventListener("change", function(event) {
      console.log('Thumbnail input changed');
      const file = event.target.files[0];
      const preview = document.getElementById("thumbnail-preview");
      
      if (!preview) {
        console.error('Thumbnail preview element not found');
        return;
      }
      
      if (file && file.type.startsWith("image/")) {
        console.log('Valid image file selected:', file.name);
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.src = e.target.result;
          preview.style.display = "block";
          
          // Add a class to the thumbnail container to show it's active
          const container = thumbnailInput.closest('.thumbnail-uploader');
          if (container) {
            container.classList.add('has-image');
          }
        };
        reader.readAsDataURL(file);
      } else {
        console.warn('Invalid or no file selected');
        preview.src = "";
        preview.style.display = "none";
        
        // Remove the active class if no image
        const container = thumbnailInput.closest('.thumbnail-uploader');
        if (container) {
          container.classList.remove('has-image');
        }
      }
    });
  } else {
    console.warn('Thumbnail input not found in the document');
  }
  
  // Set up form submission if we're on the new post page
  setupFormSubmission();
});

/**
 * Set up form submission handler
 */
function setupFormSubmission() {
  console.log('Setting up form submission handler');
  const form = document.getElementById("newPostForm");
  if (!form) {
    console.error('Form not found in the document');
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    // Process tags
    const tagsInput = document.getElementById("tags-input").value;
    const tags = tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag);
    
    // Get thumbnail file
    const thumbnailInput = document.getElementById("thumbnail");
    if (!thumbnailInput) {
      console.error('Thumbnail input not found');
      alert("Thumbnail input not found. Please refresh the page and try again.");
      return;
    }
    
    const thumbnailFile = thumbnailInput.files.length > 0 ? thumbnailInput.files[0] : null;
    
    if (!thumbnailFile) {
      console.warn('No thumbnail file selected');
      alert("Please upload a thumbnail image");
      return;
    }
    
    console.log('Thumbnail file:', thumbnailFile.name);
    
    // Get content blocks
    const contentBlocks = window.processContentBlocks ? window.processContentBlocks() : [];
    
    // Debug: Log content blocks in detail
    console.log('Content blocks processed:', contentBlocks);
    console.log('Content blocks JSON:', JSON.stringify(contentBlocks, null, 2));
    
    // Add debugging info to the page
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-info';
    debugDiv.style.border = '1px solid #ccc';
    debugDiv.style.padding = '10px';
    debugDiv.style.margin = '20px 0';
    debugDiv.style.backgroundColor = '#f5f5f5';
    debugDiv.innerHTML = `<h3>Content Debug Info</h3>
      <p>Number of content blocks: ${contentBlocks.length}</p>
      <pre>${JSON.stringify(contentBlocks, null, 2)}</pre>`;
    
    // Insert before the form
    const form = document.getElementById('newPostForm');
    form.parentNode.insertBefore(debugDiv, form.nextSibling);
    
    // Create post data object
    const postData = {
      title: document.getElementById("title").value,
      formatCategory: document.getElementById("formatCategory").value,
      contentCategory: document.getElementById("contentCategory").value,
      author: document.getElementById("author").value,
      tags: tags,
      content: contentBlocks,
      status: true,
      thumbnail: thumbnailFile
    };
    
    console.log('Post data prepared:', postData.title);
    
    try {
      console.log('Calling createPost with data:', postData);
      
      // Check if content is empty or invalid
      if (!postData.content || postData.content.length === 0) {
        console.warn('Warning: Content array is empty!');
      }
      
      // Ask user if they want to continue with submission
      const confirmSubmit = confirm(`Ready to submit post with ${postData.content.length} content blocks. Continue?`);
      
      if (confirmSubmit) {
        await createPost(postData);
      } else {
        console.log('Post submission cancelled by user');
        // Don't remove the debug info so user can inspect it
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Error: ${error.message}`);
    }
  });
}

/**
 * Create a new post by sending form data to the backend
 * @param {Object} postData - The post data object
 * @returns {Promise} Promise that resolves when the post is created
 */
function createPost(postData) {
  // Validate required fields
  if (!postData.title) {
    return Promise.reject(new Error('Title is required'));
  }
  
  if (!postData.thumbnail) {
    return Promise.reject(new Error('Thumbnail image is required'));
  }
  
  const formData = new FormData();

  try {
    // Append all the normal text fields
    formData.append("title", postData.title);
    formData.append("formatCategory", postData.formatCategory || 'Uncategorized');
    formData.append("contentCategory", postData.contentCategory || 'Uncategorized');
    formData.append("author", postData.author || 'Anonymous');
    formData.append("status", postData.status !== undefined ? postData.status : true);
    
    // Append tags as JSON string
    formData.append("tags", JSON.stringify(postData.tags || []));
    
    // Append content blocks as JSON string
    formData.append("content", JSON.stringify(postData.content || []));
    
    // Append thumbnail file
    formData.append("thumbnail", postData.thumbnail);
    
    // Append image files if any
    if (window.imageFilesToUpload && window.imageFilesToUpload.length > 0) {
      // Create an array of image filenames to help the server identify the images
      const imageFilenames = [];
      
      window.imageFilesToUpload.forEach(item => {
        if (item.file && item.filename) {
          formData.append('images', item.file, item.filename);
          imageFilenames.push(item.filename);
        }
      });
      
      // Add the list of image filenames as a separate field
      formData.append('imageFilenames', JSON.stringify(imageFilenames));
    }

    // Log the form data for debugging (don't include in production)
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      if (pair[0] !== 'thumbnail' && !pair[1] instanceof File) {
        console.log(pair[0] + ': ' + pair[1]);
      } else {
        console.log(pair[0] + ': [File object]');
      }
    }

    // Send the form data to the server
    return fetch(`${API_URL}/posts`, {
      method: "POST",
      body: formData,
    })
    .then(async (response) => {
      // Try to get more detailed error information
      if (!response.ok) {
        let errorMessage = `Server responded with status: ${response.status}`;
        try {
          // Try to parse error response as JSON
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage += ` - ${errorData.message || errorData.error}`;
          }
        } catch (e) {
          // If we can't parse as JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText.substring(0, 100)}...`;
            }
          } catch (textError) {
            console.error('Could not parse error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then((result) => {
      alert("Post created successfully!");
      window.location.href = "admin-page.html";
      return result;
    })
    .catch((error) => {
      console.error('Error submitting post:', error);
      alert(`Error creating post: ${error.message}`);
      throw error; // Re-throw to allow caller to handle
    });
  } catch (error) {
    console.error('Error preparing form data:', error);
    return Promise.reject(error);
  }
}
