/**
 * Custom middleware to handle multipart boundary errors
 * This middleware catches errors that occur when the client sends an invalid multipart request
 */
export const multipartErrorHandler = (err, req, res, next) => {
  // Check if the error is related to multipart boundary
  if (err && err.message && err.message.includes('Multipart: Boundary not found')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid multipart request. Please ensure you are sending a proper multipart/form-data request with the correct Content-Type header.',
      error: 'Boundary not found in multipart request'
    });
  }
  
  // If it's not a multipart boundary error, pass it to the next error handler
  next(err);
};

/**
 * General error handler for API requests
 */
export const generalErrorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  // Default error status is 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
}; 