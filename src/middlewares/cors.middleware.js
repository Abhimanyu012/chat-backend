/**
 * Custom CORS middleware for handling all OPTIONS requests
 * This ensures CORS preflight requests are properly processed
 */
export const corsMiddleware = (req, res, next) => {
  // Define allowed origins
  const allowedOrigins = [
    "https://chat-frontend-nine-phi.vercel.app",
    "https://chat-frontend-git-main-abhimanyukumars-projects.vercel.app",
    "https://chat-frontend-abhimanyukumars-projects.vercel.app",
    "http://localhost:5173",
  ];

  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
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
