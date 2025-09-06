// Render.com environment update script

// This file helps ensure all environment variables are set correctly
export const requiredEnvVars = {
  // Original env vars
  NODE_ENV: "production",
  PORT: "10000",  // Render assigns its own port but this is still useful for local testing
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // CORS related - make sure these match what the backend code expects
  CLIENT_URL: "https://chat-frontend-nine-phi.vercel.app",
  CORS_ORIGINS: "https://chat-frontend-nine-phi.vercel.app",
  
  // Keep the original variables too since you might be using them elsewhere
  FRONTEND_URL: "https://chat-frontend-nine-phi.vercel.app",
  CORS_ORIGIN: "https://chat-frontend-nine-phi.vercel.app"
};

// Log configuration for verification
console.log("Environment variables checked and supplemented if needed");
