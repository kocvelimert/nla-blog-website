const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")
const postRoutes = require("./routes/postRoutes")
const quoteRoutes = require("./routes/quoteRoutes")
const connectDB = require("./config/db")

require("dotenv").config() // Add parentheses here
require("./config/cloudinary")

const app = express()
const PORT = process.env.PORT || 3000

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
// Increase body parser limits to 100MB
app.use(bodyParser.json({ limit: "100mb" }))
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }))

// Register routes
app.use("/posts", postRoutes)
app.use("/quotes", quoteRoutes)

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Optional: Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
