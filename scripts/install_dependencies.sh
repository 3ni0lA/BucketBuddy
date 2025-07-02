#!/bin/bash
set -e

echo "Installing dependencies for BucketBuddy..."

# Create application directory
sudo mkdir -p /opt/bucketbuddy
sudo chown ec2-user:ec2-user /opt/bucketbuddy
cd /opt/bucketbuddy

# Install global dependencies as ec2-user
echo "Installing global dependencies..."
npm install -g pm2

# Create PM2 directories
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/run/pm2
sudo chown ec2-user:ec2-user /var/log/pm2
sudo chown ec2-user:ec2-user /var/run/pm2

# Install production dependencies
echo "Installing Node.js dependencies..."
npm ci --production

# Get instance metadata
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating production environment file..."
    cat <<EOF > .env
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
# DATABASE_URL will be updated after RDS deployment
# For now, using localhost (will be updated via user data or manual configuration)
DATABASE_URL=postgres://buddyuser:securepassword@localhost:5432/bucketbuddy
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-change_me}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-change_me}
GITHUB_CALLBACK_URL=http://${INSTANCE_IP}:5000/api/auth/github/callback
VITE_API_URL=http://${INSTANCE_IP}:5000
EOF
fi

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Dependencies installed successfully!"

