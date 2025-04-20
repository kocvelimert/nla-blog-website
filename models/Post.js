const mongoose = require("mongoose");

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
  content: [
    {
      type: { type: String, required: true },
      text: String,
      url: String,
      caption: String,
      author: String
    }
  ],
});

module.exports = mongoose.model("Post", postSchema);