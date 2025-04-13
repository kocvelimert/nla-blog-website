const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { generateId, generateSlug } = require('./utils/helpers');

const app = express();
const PORT = 3000;
const postsFile = path.join(__dirname, 'data', 'posts.json');

const multer = require('multer');


// Serve uploads
app.use('/uploads', express.static('uploads'));

// Ensure uploads folder exists
const uploadPath = 'uploads/thumbnails';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/thumbnails'); // Ensure this path is relative to server.js
  },
  filename: function (req, file, cb) {
    const title = req.body.title || 'untitled';
    const slug = generateSlug(title);
    const ext = path.extname(file.originalname); // preserves original extension
    cb(null, `${slug}${ext}`);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper to read and write file
function readPosts() {
  return JSON.parse(fs.readFileSync(postsFile));
}

function writePosts(data) {
  fs.writeFileSync(postsFile, JSON.stringify(data, null, 2));
}

// GET all posts
app.get('/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// GET posts by category (formatCategory or contentCategory)
app.get('/posts/category/:category', (req, res) => {
    const { category } = req.params;
    const posts = readPosts();
  
    const filteredPosts = posts.filter(post => 
      post.formatCategory === category || post.contentCategory === category
    );
  
    if (filteredPosts.length === 0) {
      return res.status(404).json({ message: 'No posts found for this category' });
    }
  
    res.json(filteredPosts);
  });
  
  // GET posts by tag
  app.get('/posts/tag/:tag', (req, res) => {
    const { tag } = req.params;
    const posts = readPosts();
  
    const filteredPosts = posts.filter(post => post.tags.includes(tag));
  
    if (filteredPosts.length === 0) {
      return res.status(404).json({ message: 'No posts found for this tag' });
    }
  
    res.json(filteredPosts);
  });

// GET a post
app.get('/posts/:id', (req, res) => {
    const posts = readPosts();
    const post = posts.find(p => p.id === req.params.id);
  
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
  
    res.json(post);
  });

// POST create new post
app.post('/posts', upload.single('thumbnail'), (req, res) => {
  const data = req.body;

  const id = generateId();
  const slug = generateSlug(data.title);
  const createdAt = new Date().toISOString();

  const thumbnailFilename = req.file ? req.file.filename : null;

  const newPost = {
    id,
    title: data.title,
    slug,
    formatCategory: data.formatCategory,
    contentCategory: data.contentCategory,
    tags: JSON.parse(data.tags || '[]'),
    thumbnail: thumbnailFilename,
    createdAt,
    editDates: [],
    author: data.author || "unknown",
    status: data.status === 'true' || false,
    content: []
  };

  const posts = readPosts();
  posts.push(newPost);
  writePosts(posts);

  res.status(201).json(newPost);
});




// PATCH update post
app.patch('/posts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const posts = readPosts();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  posts[index] = {
    ...posts[index],
    ...updates,
    editDates: [...posts[index].editDates, new Date().toISOString()]
  };

  writePosts(posts);
  res.json(posts[index]);
});

// DELETE post
app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;

  let posts = readPosts();
  const post = posts.find(p => p.id === id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  posts = posts.filter(p => p.id !== id);
  writePosts(posts);

  res.json({ message: 'Post deleted successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
