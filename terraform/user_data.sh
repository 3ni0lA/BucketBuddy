#!/bin/bash

# Log everything for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting BucketBuddy server setup..."

# Update system
yum update -y

# Install essential packages
yum install -y git curl wget unzip postgresql15-client ruby

# Install Node.js 18 via NVM (compatible with Amazon Linux 2)
echo "Installing Node.js via NVM..."
sudo -u ec2-user bash << 'EOF'
cd /home/ec2-user
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 18
nvm use 18
nvm alias default 18
echo 'export NVM_DIR="/home/ec2-user/.nvm"' >> /home/ec2-user/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /home/ec2-user/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /home/ec2-user/.bashrc
EOF

# Source the ec2-user environment to get Node.js
sudo -u ec2-user bash << 'EOF'
source /home/ec2-user/.bashrc
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
# Install PM2 globally
npm install -g pm2
echo "PM2 version: $(pm2 --version)"
EOF

# Install Docker for PostgreSQL
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install CodeDeploy agent
cd /home/ec2-user
wget https://aws-codedeploy-us-west-2.s3.us-west-2.amazonaws.com/latest/install
chmod +x ./install
./install auto

# Start CodeDeploy agent
service codedeploy-agent start
chkconfig codedeploy-agent on

# Setup CloudWatch logs agent
yum install -y awslogs
cat << EOF > /etc/awslogs/awslogs.conf
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/bucketbuddy-app.log]
file = /var/log/bucketbuddy-app.log
log_group_name = ${cloudwatch_log_group}
log_stream_name = {instance_id}/app.log
datetime_format = %Y-%m-%d %H:%M:%S

[/var/log/bucketbuddy-error.log]
file = /var/log/bucketbuddy-error.log
log_group_name = ${cloudwatch_log_group}
log_stream_name = {instance_id}/error.log
datetime_format = %Y-%m-%d %H:%M:%S

[/var/log/codedeploy-agent.log]
file = /var/log/aws/codedeploy-agent/codedeploy-agent.log
log_group_name = ${cloudwatch_log_group}
log_stream_name = {instance_id}/codedeploy-agent.log
datetime_format = %Y-%m-%d %H:%M:%S

[/var/log/user-data.log]
file = /var/log/user-data.log
log_group_name = ${cloudwatch_log_group}
log_stream_name = {instance_id}/user-data.log
EOF

# Start CloudWatch logs
systemctl start awslogsd
systemctl enable awslogsd

# Create application directory
mkdir -p /opt/${app_name}
cd /opt/${app_name}

# Setup PostgreSQL with Docker
echo "Setting up PostgreSQL database..."
cat << EOF > docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15
    container_name: ${app_name}-postgres
    environment:
      POSTGRES_USER: ${db_user}
      POSTGRES_PASSWORD: ${db_password}
      POSTGRES_DB: ${db_name}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${db_user}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    command: |
      postgres
      -c max_connections=100
      -c shared_buffers=128MB
      -c effective_cache_size=256MB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.7
      -c wal_buffers=16MB
      -c default_statistics_target=100

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 60

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
docker exec ${app_name}-postgres pg_isready -U ${db_user}

# Create backup directory
mkdir -p /opt/${app_name}/backups

# Create PM2 ecosystem file template
cat << EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: '${app_name}',
    script: './dist/index.js',
    cwd: '/opt/${app_name}',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: ${container_port}
    },
    log_file: '/var/log/bucketbuddy-app.log',
    error_file: '/var/log/bucketbuddy-error.log',
    out_file: '/var/log/bucketbuddy-app.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    restart_delay: 5000,
    kill_timeout: 5000
  }]
};
EOF

# Create deployment hooks directory for CodeDeploy
mkdir -p /opt/${app_name}/deployment

# Create database backup script
cat << 'EOF' > /opt/${app_name}/backup_db.sh
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="/opt/${app_name}/backups/backup_$DATE.sql"

echo "Creating database backup..."
docker exec ${app_name}-postgres pg_dump -U ${db_user} ${db_name} > $BACKUP_FILE

if [ $? -eq 0 ]; then
    # Compress backup
    gzip $BACKUP_FILE
    echo "Backup created: $BACKUP_FILE.gz"
    
    # Upload to S3 if configured
    if [ -n "${backup_bucket}" ]; then
        aws s3 cp $BACKUP_FILE.gz s3://${backup_bucket}/backups/
        echo "Backup uploaded to S3"
    fi
    
    # Clean up old backups (keep last 7 days)
    find /opt/${app_name}/backups -name "backup_*.sql.gz" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
EOF

chmod +x /opt/${app_name}/backup_db.sh

# Create restore script for migrating existing data
cat << 'EOF' > /opt/${app_name}/restore_data.sh
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo "This script restores your local database backup to the cloud instance."
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found!"
    exit 1
fi

echo "Stopping application..."
pm2 stop ${app_name} || true

echo "Restoring database from $BACKUP_FILE..."

# If it's a compressed file, decompress first
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker exec -i ${app_name}-postgres psql -U ${db_user} ${db_name}
else
    docker exec -i ${app_name}-postgres psql -U ${db_user} ${db_name} < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "Database restore completed successfully!"
    echo "Starting application..."
    pm2 start ecosystem.config.js --env production || true
else
    echo "Database restore failed!"
    exit 1
fi
EOF

chmod +x /opt/${app_name}/restore_data.sh

# Set up automatic backups (daily at 2 AM)
echo "0 2 * * * /opt/${app_name}/backup_db.sh" > /tmp/crontab_backup
crontab /tmp/crontab_backup

# Install and configure Nginx
yum install -y nginx

# Configure Nginx
cat << EOF > /etc/nginx/conf.d/${app_name}.conf
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:${container_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }
}
EOF

# Test and start Nginx
nginx -t && systemctl start nginx && systemctl enable nginx

# Set proper ownership
chown -R ec2-user:ec2-user /opt/${app_name}

# Create PM2 startup script
sudo -u ec2-user bash << 'USEREOF'
cd /opt/${app_name}
pm2 startup
EOF

# Create deployment status file
echo "ready" > /opt/${app_name}/deployment_status

# Create instructions file
cat << EOF > /opt/${app_name}/DEPLOYMENT_GUIDE.md
# BucketBuddy CI/CD Deployment Guide

## 🎉 Infrastructure Setup Complete!

Your BucketBuddy application infrastructure is ready with:
- ✅ EC2 instance with PM2
- ✅ PostgreSQL database in Docker
- ✅ CodePipeline for CI/CD
- ✅ CodeDeploy agent
- ✅ CloudWatch monitoring
- ✅ Nginx reverse proxy

## Next Steps:

### 1. Add Required Files to Your Repository

You need to add these files to your GitHub repository:

#### `buildspec.yml` (in root directory):
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo Installing dependencies...
      - npm ci
  build:
    commands:
      - echo Building the application...
      - npm run build
      - echo Build completed
  post_build:
    commands:
      - echo Creating deployment package...
      
artifacts:
  files:
    - '**/*'
  exclude-paths:
    - node_modules/**/*
    - .git/**/*
    - '*.md'
```

#### `appspec.yml` (in root directory):
```yaml
version: 0.0
os: linux
files:
  - source: /
    destination: /opt/${app_name}
    overwrite: yes
hooks:
  BeforeInstall:
    - location: scripts/install_dependencies.sh
      timeout: 300
      runas: ec2-user
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 300
      runas: ec2-user
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 300
      runas: ec2-user
```

### 2. Create Scripts Directory

Create a `scripts/` directory in your repository with:

#### `scripts/install_dependencies.sh`:
```bash
#!/bin/bash
cd /opt/${app_name}
npm ci --production
npm run db:push
```

#### `scripts/start_server.sh`:
```bash
#!/bin/bash
cd /opt/${app_name}
pm2 reload ecosystem.config.js --env production
```

#### `scripts/stop_server.sh`:
```bash
#!/bin/bash
pm2 stop ${app_name} || true
```

### 3. Migrate Your Existing Database

Upload your backup file:
```bash
scp /tmp/bucketbuddy_backup.sql ec2-user@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):/opt/${app_name}/
```

Restore it:
```bash
ssh ec2-user@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
cd /opt/${app_name}
./restore_data.sh bucketbuddy_backup.sql
```

### 4. Trigger First Deployment

Once you've added the required files to your GitHub repository, push to the main branch:

```bash
git add .
git commit -m "Add CI/CD configuration"
git push origin main
```

This will automatically trigger the CodePipeline!

## 📊 Monitoring & Management

- **Application URL**: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
- **PM2 Monitoring**: `pm2 monit`
- **View Logs**: `pm2 logs ${app_name}`
- **Application Status**: `pm2 status`
- **Database Backups**: `ls -la /opt/${app_name}/backups/`

## 🔧 Useful Commands

- Restart app: `pm2 restart ${app_name}`
- Manual backup: `./backup_db.sh`
- Check CodeDeploy agent: `service codedeploy-agent status`
- View deployment logs: `tail -f /var/log/aws/codedeploy-agent/codedeploy-agent.log`

EOF

echo ""
echo "🎉 BucketBuddy infrastructure setup completed successfully!"
echo "📖 Check /opt/${app_name}/DEPLOYMENT_GUIDE.md for next steps"
echo "🌐 Your server will be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "📊 Monitor with: pm2 monit"
echo "🔍 Status: $(cat /opt/${app_name}/deployment_status)"

