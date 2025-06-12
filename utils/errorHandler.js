/**
 * Wraps an async controller function to catch errors and pass them to Express error handler
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function} - Express middleware function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('Error caught by asyncHandler:', err);
    next(err);
  });
};

/**
 * Formats error responses for consistent API error handling
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('API Error:', err);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Determine error message based on environment
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'Something went wrong';
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(isProd ? {} : { stack: err.stack })
  });
};

/**
 * Creates a custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} - Custom error object with status code
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  asyncHandler,
  errorMiddleware,
  createError
};
