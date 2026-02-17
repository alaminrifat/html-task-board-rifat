#!/bin/sh

# Print a startup message
echo "Initializing Express.js application..."

# Run database migrations (if required)
echo "Applying database migrations..."
npm run migration:run

# Start the server
echo "Starting the server with PM2..."
pm2-runtime ecosystem.config.js