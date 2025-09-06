#!/bin/bash

# Backend Deployment Script
# This script prepares the backend for deployment

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Backend Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if running from the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Please run this script from the backend directory.${NC}"
  exit 1
fi

# 1. Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm ci --production || npm install --production

# 2. Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo -e "\n${RED}Error: .env.production not found. Please create this file with your production environment variables.${NC}"
  echo -e "Example contents:"
  echo -e "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/"
  echo -e "JWT_SECRET=your_strong_production_secret"
  echo -e "NODE_ENV=production"
  echo -e "PORT=4000"
  echo -e "CLIENT_URL=https://your-frontend-domain.com"
  exit 1
else
  echo -e "\n${GREEN}.env.production found.${NC}"
fi

# 3. Create PM2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
  echo -e "\n${YELLOW}Creating PM2 ecosystem.config.js file...${NC}"
  cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "chat-app-api",
    script: "src/index.js",
    env_production: {
      NODE_ENV: "production"
    },
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "300M",
    log_date_format: "YYYY-MM-DD HH:mm Z",
    merge_logs: true,
    watch: false
  }]
}
EOL
  echo -e "${GREEN}PM2 ecosystem.config.js created.${NC}"
fi

# 4. Verify config
echo -e "\n${YELLOW}Verifying MongoDB connection in .env.production...${NC}"
MONGODB_URI=$(grep MONGODB_URI .env.production | cut -d '=' -f2-)

if [ -z "$MONGODB_URI" ]; then
  echo -e "${RED}Error: MONGODB_URI not found in .env.production${NC}"
  exit 1
else
  echo -e "${GREEN}MONGODB_URI found.${NC}"
fi

# 5. Provide deployment instructions
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}Deployment Instructions${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "1. Transfer the backend files to your server."
echo -e "2. Install PM2 globally on your server: ${BLUE}npm install -g pm2${NC}"
echo -e "3. Start the application with: ${BLUE}pm2 start ecosystem.config.js --env production${NC}"
echo -e "4. Set up PM2 to start on system reboot: ${BLUE}pm2 startup${NC} and follow the instructions."
echo -e "5. Save the PM2 process list: ${BLUE}pm2 save${NC}"
echo -e "6. Set up a reverse proxy (Nginx/Apache) to forward requests to port ${BLUE}4000${NC}."
echo -e "${BLUE}=====================================${NC}"

echo -e "\n${GREEN}Backend ready for deployment!${NC}"
echo -e "${YELLOW}Note: Make sure to update .env.production with your actual production values before deploying.${NC}"
