const fs = require("fs");
const path = require("path");
const postsFile = path.join(__dirname, "..", "data", "posts.json");

const readPosts = () => {
  return JSON.parse(fs.readFileSync(postsFile));
};

const writePosts = (data) => {
  fs.writeFileSync(postsFile, JSON.stringify(data, null, 2));
};

module.exports = { readPosts, writePosts };
