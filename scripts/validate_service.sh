#!/bin/bash
set -e

echo "Validating BucketBuddy service..."

# Load PM2 if not already loaded
export PM2_HOME=/home/ec2-user/.pm2

# Check if PM2 process is running
if ! pm2 describe bucketbuddy > /dev/null 2>&1; then
    echo "❌ PM2 process not found"
    exit 1
fi

# Check if the application responds to HTTP requests
echo "Testing application health..."

# Wait for application to be ready
sleep 10

# Test the health endpoint
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed, trying main endpoint..."
    
    # Test the main endpoint as fallback
    if curl -f http://localhost:5000 > /dev/null 2>&1; then
        echo "✅ Main endpoint check passed"
    else
        echo "❌ Service validation failed"
        echo "PM2 status:"
        pm2 status
        echo "Last 20 lines of logs:"
        pm2 logs bucketbuddy --lines 20
        exit 1
    fi
fi

echo "✅ Service validation completed successfully!"
echo "PM2 Status:"
pm2 status

