const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema({
  type: String,
  data: mongoose.Schema.Types.Mixed,
});

const postSchema = new mongoose.Schema({
  title: String,
  slug: String,
  formatCategory: String,
  contentCategory: String,
  tags: [String],
  thumbnail: String,
  createdAt: { type: Date, default: Date.now },
  editDates: [Date],
  author: { type: String, default: "unknown" },
  status: { type: Boolean, default: false },
  content: [contentBlockSchema],
});

module.exports = mongoose.model("Post", postSchema);
