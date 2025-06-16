#!/bin/bash

echo "Stopping BucketBuddy application..."

# Load PM2 if not already loaded
export PM2_HOME=/home/ec2-user/.pm2

# Stop the application gracefully
if pm2 describe bucketbuddy > /dev/null 2>&1; then
    echo "Stopping existing application..."
    pm2 stop bucketbuddy
    echo "Application stopped"
else
    echo "Application is not running"
fi

echo "Stop script completed"

