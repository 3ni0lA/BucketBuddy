module.exports = {
  apps: [{
    name: 'bucketbuddy',
    script: './dist/index.js',
    cwd: '/opt/bucketbuddy',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/bucketbuddy-error.log',
    out_file: '/var/log/pm2/bucketbuddy-out.log',
    log_file: '/var/log/pm2/bucketbuddy.log',
    pid_file: '/var/run/pm2/bucketbuddy.pid',
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
