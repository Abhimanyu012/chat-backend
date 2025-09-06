#!/bin/bash

# Backend Deployment Script
# This script prepares the backend for deployment

echo "🚀 Starting backend deployment process..."
echo "📂 Working directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "backend" "package.json"; then
  echo "❌ Error: This script should be run from the backend directory"
  echo "Please run: cd /path/to/backend && ./deploy-backend.sh"
  exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "⚠️  Warning: .env.production file not found"
  echo "Creating a template .env.production file..."
  cat > .env.production << EOF
MONGODB_URI=mongodb+srv://abhimanyukumarssm0012:abhimanyu148@cluster0.vysj6xi.mongodb.net/
JWT_SECRET=A7c96D!k2mH8fP3sL5tQ9xR0zV4wY2uN
NODE_ENV=production

CLOUDINARY_CLOUD_NAME=dqqrc3sp7
CLOUDINARY_API_KEY=495328196685556
CLOUDINARY_API_SECRET=FxreuvGkqUVax2ByQ18V8kinxDc

PORT=4000
# Production frontend URL - Update this!
CLIENT_URL=https://your-frontend-domain.com
# Optionally specify multiple origins
# CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
EOF
  echo "⚠️  Please edit .env.production with your actual production values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production || { echo "❌ Failed to install dependencies"; exit 1; }

# Check MongoDB connection
echo "🔍 Testing MongoDB connection..."
NODE_ENV=production node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });
async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
testConnection();
" || { echo "❌ MongoDB connection test failed"; exit 1; }

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
  echo "📝 Creating PM2 ecosystem config file..."
  cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "chat-backend",
    script: "src/index.js",
    env_production: {
      NODE_ENV: "production",
    },
    max_memory_restart: "300M",
    instances: "max",
    exec_mode: "cluster",
    exp_backoff_restart_delay: 100
  }]
};
EOF
  echo "✅ PM2 ecosystem file created"
fi

# Success message
echo "✅ Backend preparation completed successfully!"
echo ""
echo "📋 Deployment Options:"
echo "--------------------------------------------------------"
echo "1️⃣  Traditional Server Deployment with PM2:"
echo "   - Transfer files to your server"
echo "   - Run: pm2 start ecosystem.config.js --env production"
echo ""
echo "2️⃣  Docker Deployment:"
echo "   - Use the Dockerfile in the project root"
echo "   - Run: docker build -t chat-backend ."
echo "   - Run: docker run -p 4000:4000 chat-backend"
echo ""
echo "3️⃣  Platform as a Service (Heroku, Render, etc.):"
echo "   - Follow your platform's deployment instructions"
echo "   - Make sure to set all environment variables"
echo "--------------------------------------------------------"
echo ""
echo "🔐 Security Reminder:"
echo "   - Make sure your MongoDB Atlas username/password is secure"
echo "   - Set a strong JWT_SECRET in your production environment"
echo "   - Configure proper CORS settings for your frontend domain"
echo "   - Consider setting up a reverse proxy (Nginx) with SSL"
