#!/bin/bash
set -e

echo "Starting BucketBuddy application..."
cd /opt/bucketbuddy

# Load PM2 if not already loaded
export PM2_HOME=/home/ubuntu/.pm2

# Start/reload the application with PM2
if pm2 describe bucketbuddy > /dev/null 2>&1; then
    echo "Reloading existing application..."
    pm2 reload ecosystem.config.js --env production
else
    echo "Starting new application..."
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 configuration
pm2 save

echo "Application started successfully!"

# Wait a moment for the application to start
sleep 5

# Check if the application is running
if pm2 describe bucketbuddy > /dev/null 2>&1; then
    echo "✅ Application is running"
    pm2 status
else
    echo "❌ Application failed to start"
    exit 1
fi

