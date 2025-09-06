/**
 * Custom CORS middleware for handling all OPTIONS requests
 * This ensures CORS preflight requests are properly processed
 */
export const corsMiddleware = (req, res, next) => {
  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    // Set CORS headers for preflight requests
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // End preflight request with 204 No Content status
    return res.status(204).end();
  }
  
  // For all other requests, proceed to the next middleware
  next();
};
