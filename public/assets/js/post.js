document.addEventListener("DOMContentLoaded", () => {
    // Get the post ID from URL
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(param)
    }
  
    const postId = getQueryParam("id")
  
    if (!postId) {
      window.location.href = "index.html"
      return
    }
  
    // DOM elements
    const postTitle = document.getElementById("post-title")
    const postTitleBreadcrumb = document.getElementById("post-title-breadcrumb")
    const postCategory = document.getElementById("post-category")
    const postContentContainer = document.getElementById("post-content-container")
  
    // Fetch post details
    fetchPostById(postId)
  
    // Also fetch latest posts for the "Last Posts" section
    fetchLatestPosts()
  
    // Function to fetch post by ID
    function fetchPostById(id) {
      fetch(`http://localhost:3000/posts/${id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok")
          }
          return response.json()
        })
        .then((post) => {
          renderPost(post)
        })
        .catch((error) => {
          console.error("Error fetching post:", error)
          postContentContainer.innerHTML = `
            <div class="error-message">
              <h4>Error loading post</h4>
              <p>${error.message}</p>
              <a href="index.html" class="btn btn-base">Return to Home</a>
            </div>
          `
        })
    }
  
    // Function to fetch latest posts
    function fetchLatestPosts() {
      fetch(`http://localhost:3000/posts/latest?limit=3`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok")
          }
          return response.json()
        })
        .then((posts) => {
          renderLatestPosts(posts)
        })
        .catch((error) => {
          console.error("Error fetching latest posts:", error)
          const lastPostsContainer = document.getElementById("last-posts-container")
          if (lastPostsContainer) {
            lastPostsContainer.innerHTML = `
              <div class="col-12">
                <p>Could not load latest posts. ${error.message}</p>
              </div>
            `
          }
        })
    }
  
    // Function to render post
    function renderPost(post) {
      // Update page title and breadcrumb
      document.title = `${post.title} | No Life Anime`
  
      // Check if elements exist before using them
      if (postTitle) {
        postTitle.textContent = post.title;
      }
      if (postTitleBreadcrumb) {
        postTitleBreadcrumb.textContent = post.title;
      }
      if (postCategory) {
        const primaryCategory = post.formatCategory || post.contentCategory || "Category";
        postCategory.innerHTML = `<a href="category.html?slug=${primaryCategory}">${primaryCategory}</a>`;
      }
  
      // Get thumbnail URL - handle Cloudinary format
      let thumbnailUrl = "assets/img/placeholder.jpg"
  
      if (post.thumbnail) {
        // Check if thumbnail is already a full URL
        if (post.thumbnail.startsWith("http")) {
          thumbnailUrl = post.thumbnail
        }
        // If it's a Cloudinary public_id, construct the URL
        else if (post.thumbnail.includes("thumbnails/")) {
          thumbnailUrl = `https://res.cloudinary.com/dpwktwbzk/image/upload/${post.thumbnail}`
        }
      }
  
      // Format date
      const createdDate = new Date(post.createdAt).toLocaleDateString()
  
      // Check if post has been edited
      let editDateHtml = ""
      if (post.editDates && post.editDates.length > 0) {
        const lastEditDate = new Date(post.editDates[post.editDates.length - 1]).toLocaleDateString()
        editDateHtml = `<span class="edit-indicator">(Güncellenme: ${lastEditDate})</span>`
      }
      const formattedContentCategoryName = post.formatCategory.charAt(0).toUpperCase() + post.formatCategory.slice(1)
      const formattedFormatCategoryName = post.contentCategory.charAt(0).toUpperCase() + post.contentCategory.slice(1)
      // Start building the post HTML
      let postHtml = `
        <div class="single-blog-inner m-0">
          <div class="single-post-wrap style-overlay">
            <div class="thumb">
              <img src="${thumbnailUrl}" alt="${post.title}">
            </div>
            <div class="details pb-4">
              <div class="post-meta-single mb-2" id="post-meta-4pc">
                <ul>
                  <li><a class="tag-base tag-blue" href="category.html?slug=${post.formatCategory}">${formattedContentCategoryName}</a></li>
                  <li><a class="tag-base tag-blue" href="category.html?slug=${post.contentCategory}">${formattedFormatCategoryName}</a></li>
                  <li>
                    <p class="post-meta-with-edit"><i class="fa fa-user"></i>${post.author}</p>
                    <p class="post-meta-with-edit"></p>
                    <p class="post-meta-with-edit"><i class="fa fa-clock-o"></i>${createdDate} ${editDateHtml}</p>
                  </li>
                </ul>
              </div>
              <h5 class="title mt-0" id="title-4pc">${post.title}</h5>
            </div>
          </div>
          <h5 class="title mt-0" id="title-4mob">${post.title}</h5>
          <div class="post-meta-single mb-2" id="post-meta-4mob">
                <ul>
                  <li><a class="tag-base tag-blue" href="category.html?slug=${post.formatCategory}">${formattedContentCategoryName}</a></li>
                  <li><a class="tag-base tag-blue" href="category.html?slug=${post.contentCategory}">${formattedFormatCategoryName}</a></li>
                </ul>
                <div id="pmed-4mob">
                  <p class="post-meta-with-edit"><i class="fa fa-clock-o"></i>${createdDate} ${editDateHtml}</p>
                </div>
                
              </div>
          <div class="post-content">
      `
      // Add simplified author section
      
  
      // Process content blocks
    if (post.content && Array.isArray(post.content)) {
        // Track consecutive images to group them
        let consecutiveImages = []
  
        for (let i = 0; i < post.content.length; i++) {
          const block = post.content[i]
  
          if (block.type === "paragraph") {
            // If we have collected images, render them before the paragraph
            if (consecutiveImages.length > 0) {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
            
            // Handle both old format (text) and new format (content)
            const content = block.content || block.text || ""
            postHtml += `<p>${content}</p>`
          } else if (block.type === "bulletList" || block.type === "orderedList") {
            // If we have collected images, render them before the list
            if (consecutiveImages.length > 0) {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
            
            // Get the list content - check both content and text properties
            const listContent = block.text || block.content || ""
            
            // The content should already contain <ul> or <ol> tags from the editor
            postHtml += listContent
          } else if (block.type === "heading") {
            // If we have collected images, render them before the heading
            if (consecutiveImages.length > 0) {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
            
            // Handle both old format (text) and new format (content)
            const content = block.content || block.text || ""
            postHtml += `<h2 class="post-heading">${content}</h2>`
          } else if (block.type === "blockquote" || block.type === "quote") {
            // If we have collected images, render them before the quote
            if (consecutiveImages.length > 0) {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
            
            // Handle both old format (text/subtext) and new format (content/author)
            let content = block.content || block.text || ""
            const attribution = block.author || block.subtext || ""
            
            // Extract text content from any nested blockquotes
            if (content.includes('<blockquote>')) {
              // Create a temporary div to parse the HTML content
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = content
              
              // Extract the text content
              const extractedText = tempDiv.textContent || ''
              content = extractedText.trim()
            }
            
            // Create a clean blockquote with the extracted content
            postHtml += `<blockquote><p>${content}</p>${attribution ? `<cite>${attribution}</cite>` : ""}</blockquote>`
          } else if (block.type === "youtube") {
            // If we have collected images, render them before the video
            if (consecutiveImages.length > 0) {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
  
            // Extract video ID from YouTube URL
            const videoId = extractYouTubeId(block.url)
            postHtml += `
              <div class="youtube-embed">
                <iframe 
                  src="https://www.youtube.com/embed/${videoId}" 
                  title="YouTube video player" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              </div>
            `
          } else if (block.type === "image") {
            // Collect consecutive images
            let imageUrl = block.url || ""
            if (!imageUrl.startsWith("http") && imageUrl.includes("content-images/")) {
              imageUrl = `https://res.cloudinary.com/dpwktwbzk/image/upload/${imageUrl}`
            }
  
            consecutiveImages.push({
              url: imageUrl,
              caption: block.caption || "",
            })
  
            // If this is the last block or the next block is not an image, render the collected images
            if (i === post.content.length - 1 || post.content[i + 1].type !== "image") {
              postHtml += renderImageGrid(consecutiveImages)
              consecutiveImages = []
            }
          }
        }
      }
  
      // Close post content div
      postHtml += `</div>`

      
  
      // Add tags section
      if (post.tags && post.tags.length > 0) {
        postHtml += `
          <div class="post-tags">
            <div class="meta">
              <div class="row">
                <div class="col-lg-12">
                  <div class="tags">
                    <span>Tags:</span>
                    <div class="tag-list">
                      ${post.tags.map((tag) => `<a href="tag.html?tag=${encodeURIComponent(tag)}">${tag}</a>`).join("")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      }
  
      
  
      // Add placeholder for "Last Posts" section
      postHtml += `
        <div class="last-posts-section">
          <div class="section-title">
            <h5>Son Gönderiler</h5>
          </div>
          <div class="row justify-content-center" id="last-posts-container">
            <div class="col-12 text-center">
              <p>Son Gönderiler Yükleniyor...</p>
            </div>
          </div>
        </div>
      `
  
      // Render the post content
      postContentContainer.innerHTML = postHtml
    }

    // Function to render image grid
  function renderImageGrid(images) {
    if (images.length === 0) return ""

    let gridHtml = `<div class="image-grid">`

    if (images.length === 1) {
      // Single image
      gridHtml += `
        <figure class="image-grid-item single">
          <img src="${images[0].url}" alt="Post image">
        </figure>
      `
    } else {
      // Multiple images - arrange in pairs
      for (let i = 0; i < images.length; i++) {
        gridHtml += `
          <figure class="image-grid-item">
            <img src="${images[i].url}" alt="Post image">
          </figure>
        `
      }
    }

    gridHtml += `</div>`
    return gridHtml
  }
    
    // Function to render latest posts
    function renderLatestPosts(posts) {
      const lastPostsContainer = document.getElementById("last-posts-container")
      if (!lastPostsContainer) return
  
      if (!posts || posts.length === 0) {
        lastPostsContainer.innerHTML = `
          <div class="col-12">
            <p>No recent posts available.</p>
          </div>
        `
        return
      }
  
      let postsHtml = ""
  
      posts.forEach((post) => {
        // Get thumbnail URL
        let thumbnailUrl = "assets/img/placeholder.jpg"
  
        if (post.thumbnail) {
          if (post.thumbnail.startsWith("http")) {
            thumbnailUrl = post.thumbnail
          } else if (post.thumbnail.includes("thumbnails/")) {
            thumbnailUrl = `https://res.cloudinary.com/dpwktwbzk/image/upload/${post.thumbnail}`
          }
        }
  
        // Format date
        const postDate = new Date(post.createdAt).toLocaleDateString()
  
        postsHtml += `
          <div class="col-lg-4 col-md-6">
            <div class="single-post-wrap">
              <div class="thumb">
                <img src="${thumbnailUrl}" alt="${post.title}">
                <a class="tag-base tag-${post.formatCategory === "anime" ? "blue" : "purple"}" href="category.html?slug=${post.formatCategory}">${post.formatCategory}</a>
              </div>
              <div class="details">
                <div class="post-meta-single">
                  <ul>
                    <li><i class="fa fa-clock-o"></i>${postDate}</li>
                  </ul>
                </div>
                <h6 class="title mt-2"><a href="post.html?id=${post._id}">${post.title}</a></h6>
              </div>
            </div>
          </div>
        `
      })
  
      lastPostsContainer.innerHTML = postsHtml
    }
  
    // Helper function to extract YouTube video ID
    function extractYouTubeId(url) {
      if (!url) return ""
  
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
  
      return match && match[2].length === 11 ? match[2] : ""
    }
  
    // Handle quote navigation
    const quotes = [
      {
        text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
        author: "Himura Kenshin, Rurouni Kenshin",
      },
      {
        text: "If you don't take risks, you can't create a future!",
        author: "Monkey D. Luffy, One Piece",
      },
      {
        text: "People's lives don't end when they die. It ends when they lose faith.",
        author: "Itachi Uchiha, Naruto",
      },
      {
        text: "The world isn't perfect. But it's there for us, doing the best it can... that's what makes it so damn beautiful.",
        author: "Roy Mustang, Full Metal Alchemist",
      },
    ]
  
    let currentQuoteIndex = 0
    const quoteText = document.querySelector(".quote-item blockquote")
    const quoteAuthor = document.querySelector(".quote-author span")
    const prevButton = document.querySelector(".prev-quote")
    const nextButton = document.querySelector(".next-quote")
  
    if (prevButton && nextButton) {
      prevButton.addEventListener("click", () => {
        currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length
        updateQuote()
      })
  
      nextButton.addEventListener("click", () => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length
        updateQuote()
      })
  
      function updateQuote() {
        const quote = quotes[currentQuoteIndex]
        quoteText.textContent = quote.text
        quoteAuthor.textContent = quote.author
      }
    }
  })
  