const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const postRoutes = require("./routes/postRoutes");
const connectDB = require("./config/db");

require("dotenv").config;

const app = express();
const PORT = 3000;

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register routes
app.use("/posts", postRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
