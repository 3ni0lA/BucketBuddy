#!/bin/bash
set -e

echo "Installing dependencies for BucketBuddy..."
mkdir -p /opt/bucketbuddy
cd /opt/bucketbuddy

# Install production dependencies
echo "Installing Node.js dependencies..."
npm ci --production

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating production environment file..."
    cat << EOF > .env
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
DATABASE_URL=postgres://buddyuser:securepassword@localhost:5432/bucketbuddy
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000/api/auth/github/callback
VITE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000
EOF
fi

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Dependencies installed successfully!"

