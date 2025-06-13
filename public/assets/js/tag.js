document.addEventListener("DOMContentLoaded", () => {
  // Get the tag from URL
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  const tag = getQueryParam("tag");
  const currentPage = Number.parseInt(getQueryParam("page")) || 1;
  const postsPerPage = 12;

  if (!tag) {
    window.location.href = "index.html";
    return;
  }

  // Format and update tag title
  const tagTitle = document.getElementById("tag-title");
  const formattedTagName = tag.charAt(0).toUpperCase() + tag.slice(1);

  tagTitle.textContent = `#${tag}`;
  document.title = `#${tag} | No Life Anime`;

  const postsContainer = document.getElementById("posts-container");
  postsContainer.innerHTML = `
      <div class="col-12 text-center loading-spinner">
        <div class="spinner">
          <div class="dot1"></div>
          <div class="dot2"></div>
        </div>
      </div>
    `;

  fetchPostsByTag(tag, currentPage, postsPerPage);

  function fetchPostsByTag(tag, page, limit) {
    fetch(`http://localhost:3000/posts/tag/${tag}?page=${page}&limit=${limit}`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        const { posts, totalPages } = data;

        if (!posts || posts.length === 0) {
          postsContainer.innerHTML = `
              <div class="col-12 text-center">
                <div class="error-message">
                  <h4>No posts found</h4>
                  <p>No posts found with this tag.</p>
                </div>
              </div>
            `;
          document.querySelector(".pagination-container").style.display =
            "none";
          return;
        }

        renderPosts(posts);
        renderPagination(currentPage, totalPages, tag);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        postsContainer.innerHTML = `
            <div class="col-12 text-center">
              <div class="error-message">
                <h4>Error loading posts</h4>
                <p>${error.message}</p>
              </div>
            </div>
          `;
        document.querySelector(".pagination-container").style.display = "none";
      });
  }

  // Function to render posts
  function renderPosts(posts) {
    postsContainer.innerHTML = "";

    posts.forEach((post) => {
      // Create post HTML
      const postElement = document.createElement("div");
      postElement.className = "col-lg-4 col-md-6";

      // Get thumbnail URL - handle Cloudinary format
      let thumbnailUrl = "assets/img/placeholder.jpg";

      if (post.thumbnail) {
        // Check if thumbnail is already a full URL
        if (post.thumbnail.startsWith("http")) {
          thumbnailUrl = post.thumbnail;
        }
        // If it's a Cloudinary public_id, construct the URL
        else if (post.thumbnail.includes("thumbnails/")) {
          thumbnailUrl = `https://res.cloudinary.com/dpwktwbzk/image/upload/${post.thumbnail}`;
        }
      }

      // Format categories for display
      const formatCategory = post.formatCategory || "";
      const contentCategory = post.contentCategory || "";

      const formattedFormatCategoryName =
        formatCategory.charAt(0).toUpperCase() + post.formatCategory.slice(1);
      const formattedContentCategoryName =
        contentCategory.charAt(0).toUpperCase() + post.contentCategory.slice(1);

      postElement.innerHTML = `
        <div class="single-post-wrap style-box">
          <div class="thumb">
            <img src="${thumbnailUrl}" alt="${post.title}" />
          </div>
          <div class="details">
            <div class="post-meta-single mb-4 pt-1">
              <ul class="category-tag-container">
                <li>
                  <a class="tag-base tag-light-blue" href="category.html?slug=${formatCategory}">${formattedFormatCategoryName}</a>
                </li>
                <li>
                  <a class="tag-base tag-light-blue" href="category.html?slug=${contentCategory}">${formattedContentCategoryName}</a>
                </li>
              </ul>
            </div>
            <h6 class="title">
              <a href="post.html?id=${post._id}">${post.title}</a>
            </h6>
            <a class="btn btn-base mt-4" href="post.html?id=${post._id}">Okumak için >></a>
          </div>
        </div>
      `;

      postsContainer.appendChild(postElement);
    });
  }

  // Function to render pagination controls
  function renderPagination(currentPage, totalPages, tag) {
    const paginationContainer = document.querySelector(".pagination");

    if (!paginationContainer) return;

    let paginationHTML = "";

    // Previous button
    paginationHTML += `
      <li class="page-item prev ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="${
          currentPage > 1 ? `tag.html?tag=${tag}&page=${currentPage - 1}` : "#"
        }" aria-label="Previous">
          <i class="fa fa-angle-left"></i>
        </a>
      </li>
    `;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="tag.html?tag=${tag}&page=${i}">${i}</a>
        </li>
      `;
    }

    // Next button
    paginationHTML += `
      <li class="page-item next ${
        currentPage === totalPages ? "disabled" : ""
      }">
        <a class="page-link" href="${
          currentPage < totalPages
            ? `tag.html?tag=${tag}&page=${currentPage + 1}`
            : "#"
        }" aria-label="Next">
          <i class="fa fa-angle-right"></i>
        </a>
      </li>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Show pagination container
    document.querySelector(".pagination-container").style.display =
      totalPages > 1 ? "block" : "none";
  }

  
});
