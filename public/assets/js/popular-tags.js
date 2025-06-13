document.addEventListener("DOMContentLoaded", () => {
    const footerTagContainer = document.getElementById("footer-tags");
    if (!footerTagContainer) return;

    fetch("http://localhost:3000/posts/popular-tags")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch popular tags");
        return res.json();
      })
      .then((tags) => {
        if (!tags || tags.length === 0) {
          footerTagContainer.innerHTML = "<p>No tags found.</p>";
          return;
        }

        footerTagContainer.innerHTML = tags
          .map(
            (tag) => `<a href="tag.html?tag=${encodeURIComponent(tag.name)}">${tag.name}</a>`
          )
          .join("");
      })
      .catch((err) => {
        console.error("Error loading footer tags:", err);
        footerTagContainer.innerHTML = "<p>Error loading tags.</p>";
      });
  });
