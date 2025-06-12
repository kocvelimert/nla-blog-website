const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    text: String,
    url: String,
    filename: String,
    caption: String,
    subtext: String,
  },
  { _id: false }
);

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
  content: [contentBlockSchema], // Nested schema olarak tanımlandı
});

module.exports = mongoose.model("Post", postSchema);


// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//   title: String,
//   slug: String,
//   formatCategory: String,
//   contentCategory: String,
//   tags: [String],
//   thumbnail: String,
//   createdAt: { type: Date, default: Date.now },
//   editDates: [Date],
//   author: { type: String, default: "unknown" },
//   status: { type: Boolean, default: false },
//   content: [
//     {
//       type: { type: String, required: true },
//       text: String,
//       url: String,
//       caption: String,
//       subtext: String
//     }
//   ],
// });

// module.exports = mongoose.model("Post", postSchema);

