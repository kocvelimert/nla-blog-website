const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const postRoutes = require("./routes/postRoutes");
const connectDB = require("./config/db");

require("dotenv").config(); // Add parentheses here
require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Register routes
app.use("/posts", postRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});