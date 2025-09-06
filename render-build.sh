#!/usr/bin/env bash
# Build script for Render.com

# Exit on error
set -o errexit

# Install dependencies
npm install

# Print versions for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# List all environment variables (excluding secrets)
echo "Environment variables:"
env | grep -v -E 'SECRET|KEY|PASSWORD|TOKEN'

# Verify MongoDB connection string exists
if [ -z "$MONGODB_URI" ]; then
    echo "WARNING: MONGODB_URI is not set!"
    # Don't fail the build, as we have fallbacks in the code
fi

# Print success message
echo "Build completed successfully!"
