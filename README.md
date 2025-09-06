# Chat Application Backend

This is the backend for a real-time chat application built with:

- **Node.js** and **Express**: For the API server
- **Socket.IO**: For real-time messaging
- **MongoDB**: For data storage
- **JWT**: For authentication
- **Cloudinary**: For image uploads

## Features

- User authentication (login, signup)
- Real-time messaging
- Image upload support
- Online user status

## API Routes

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/logout`: Logout a user
- `GET /api/auth/check`: Check authentication status

### Messages
- `GET /api/message/:id`: Get messages for a specific user
- `POST /api/message`: Send a new message

## Environment Variables

The application requires the following environment variables:

```
NODE_ENV=production
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=your_frontend_url
CORS_ORIGIN=your_frontend_url
```

## Deployment

This repository is set up for easy deployment to Render.com:

1. Create a new Web Service in Render.com
2. Link your GitHub repository
3. Configure these settings:
   - Build Command: `chmod +x ./render-build.sh && ./render-build.sh`
   - Start Command: `npm start`
   - Node version: 18 or higher

4. Add all environment variables in the Render dashboard:
   - MONGODB_URI
   - JWT_SECRET
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - CLIENT_URL (your Vercel frontend URL)
   - CORS_ORIGINS (your Vercel frontend URL)
   - NODE_ENV=production

## Troubleshooting

### CORS Issues
Make sure your frontend URL is correctly added to the CORS configuration in both index.js and socket.js files.

### MongoDB Connection Issues
Verify that your MONGODB_URI environment variable is correctly set in your Render.com dashboard. The application has fallbacks but requires this for production.

### Socket.IO Connection Issues
Check that the Socket.IO CORS settings match your frontend domain.
