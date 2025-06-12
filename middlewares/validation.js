/**
 * Validates post creation/update input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePostInput = (req, res, next) => {
  // Validate title
  if (!req.body.title || req.body.title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  // Validate content if provided
  if (req.body.content) {
    try {
      // If content is a string, try to parse it as JSON
      if (typeof req.body.content === 'string') {
        JSON.parse(req.body.content);
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Content must be valid JSON if provided as a string',
        details: error.message
      });
    }
  }
  
  // If we get here, validation passed
  next();
};

/**
 * Validates post ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePostId = (req, res, next) => {
  const { id } = req.params;
  
  // Check if ID is provided
  if (!id) {
    return res.status(400).json({ error: 'Post ID is required' });
  }
  
  // Check if ID is a valid MongoDB ObjectId (24 hex characters)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(id)) {
    return res.status(400).json({ error: 'Invalid post ID format' });
  }
  
  next();
};

module.exports = {
  validatePostInput,
  validatePostId
};
