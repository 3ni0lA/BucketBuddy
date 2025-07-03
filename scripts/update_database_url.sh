#!/bin/bash
set -e

echo "Updating database connection to use RDS..."

# Check if RDS endpoint is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <rds-endpoint>"
    echo "Example: $0 bucketbuddy-postgres.xxxxx.us-west-2.rds.amazonaws.com"
    exit 1
fi

RDS_ENDPOINT=$1
DB_NAME="${DB_NAME:-bucketbuddy}"
DB_USER="${DB_USER:-buddyuser}"
DB_PASSWORD="${DB_PASSWORD:-securepassword}"

# Navigate to application directory
cd /opt/bucketbuddy

# Update .env file
echo "Updating DATABASE_URL in .env file..."
sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@$RDS_ENDPOINT/$DB_NAME|" .env

# Verify the change
echo "New DATABASE_URL:"
grep "DATABASE_URL" .env

# Test database connection
echo "Testing database connection..."
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful:', res.rows[0]);
    pool.end();
  }
});
"

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Restart PM2 process
echo "Restarting application..."
pm2 restart bucketbuddy || echo "PM2 process not running yet"

echo "✅ Database URL updated successfully!"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Database: $DB_NAME"
