#!/bin/bash
set -e

echo "Installing dependencies for BucketBuddy..."

# Source environment to get Node.js PATH
source /home/ec2-user/.bashrc || true
export PATH=/usr/bin:$PATH

# Verify Node.js and npm are available
echo "Node.js version: $(node --version 2>/dev/null || echo 'not found')"
echo "NPM version: $(npm --version 2>/dev/null || echo 'not found')"

# If npm is not found, try to source it manually
if ! command -v npm &> /dev/null; then
    echo "NPM not found in PATH, trying to locate..."
    export PATH="/usr/bin:/usr/local/bin:$PATH"
    # Also try the common Node.js installation path
    if [ -f "/usr/bin/npm" ]; then
        export PATH="/usr/bin:$PATH"
    elif [ -f "/usr/local/bin/npm" ]; then
        export PATH="/usr/local/bin:$PATH"
    fi
fi

# Create application directory
sudo mkdir -p /opt/bucketbuddy
sudo chown ec2-user:ec2-user /opt/bucketbuddy
cd /opt/bucketbuddy

# PM2 should already be installed globally by user_data.sh
echo "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found, installing..."
    npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi

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

