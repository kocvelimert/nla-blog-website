const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const postRoutes = require("./routes/postRoutes");
const connectDB = require("./config/db");
const cloudinary = require('./config/cloudinary');

require("dotenv").config;
require("./config/cloudinary");

const app = express();
const PORT = 3000;

connectDB();

app.use(cors());
app.use(bodyParser.json());

// Register routes
app.use("/posts", postRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
