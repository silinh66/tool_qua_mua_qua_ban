module.exports = (err, req, res, next) => {
  console.error("Application error:", err.stack || err);
  
  // If response headers have already been sent, delegate to default error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Check if it's our custom API error response
  if (err.success === false) {
    // This is a handled API error from our controller
    return res.status(err.status || 500).json({
      success: false,
      error: err.error || 'API Error',
      message: err.message || 'An error occurred while processing your request',
      status: err.status || 500
    });
  }
  
  // For all other errors, provide a generic error response
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    status: status
  });
};