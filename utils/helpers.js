// utils/helpers.js
function generateId(length = 12) {
    return [...Array(length)].map(() => (
      Math.random().toString(36)[2]
    )).join('');
  }
  
  function generateSlug(title) {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  module.exports = {
    generateId,
    generateSlug
  };
  