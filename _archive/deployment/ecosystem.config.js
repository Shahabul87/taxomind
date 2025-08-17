// PM2 Ecosystem Configuration for Production Deployment

module.exports = {
  apps: [
    {
      name: 'alam-lms-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || '0.0.0.0',
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 3001,
        HOST: process.env.HOST || '0.0.0.0',
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process Management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      autorestart: true,
      
      // Advanced Features
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      watch_options: {
        followSymlinks: false,
      },
      
      // Health Monitoring
      health_check_interval: 30000,
      health_check_grace_period: 10000,
      
      // Performance Monitoring
      pmx: true,
      source_map_support: true,
      
      // Custom Environment Variables
      env_file: '.env.production',
    },
    
    // Background Workers
    {
      name: 'alam-lms-ml-worker',
      script: './workers/ml-worker.js',
      cwd: './',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'ml',
        WORKER_CONCURRENCY: 4,
      },
      log_file: './logs/ml-worker.log',
      out_file: './logs/ml-worker-out.log',
      error_file: './logs/ml-worker-error.log',
      max_memory_restart: '2G',
      min_uptime: '10s',
      max_restarts: 3,
      restart_delay: 5000,
      autorestart: true,
    },
    
    {
      name: 'alam-lms-analytics-worker',
      script: './workers/analytics-worker.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'analytics',
        WORKER_BATCH_SIZE: 1000,
      },
      log_file: './logs/analytics-worker.log',
      out_file: './logs/analytics-worker-out.log',
      error_file: './logs/analytics-worker-error.log',
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 3,
      restart_delay: 3000,
      autorestart: true,
      cron_restart: '0 4 * * *', // Restart daily at 4 AM
    },
    
    {
      name: 'alam-lms-job-market-worker',
      script: './workers/job-market-worker.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'job_market',
        UPDATE_INTERVAL: 3600000, // 1 hour
      },
      log_file: './logs/job-market-worker.log',
      out_file: './logs/job-market-worker-out.log',
      error_file: './logs/job-market-worker-error.log',
      max_memory_restart: '256M',
      min_uptime: '10s',
      max_restarts: 3,
      restart_delay: 10000,
      autorestart: true,
    },
    
    {
      name: 'alam-lms-notification-worker',
      script: './workers/notification-worker.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'notifications',
        QUEUE_CONCURRENCY: 10,
      },
      log_file: './logs/notification-worker.log',
      out_file: './logs/notification-worker-out.log',
      error_file: './logs/notification-worker-error.log',
      max_memory_restart: '256M',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 2000,
      autorestart: true,
    },
  ],
  
  deploy: {
    production: {
      user: process.env.DEPLOY_USER || 'deploy',
      host: process.env.DEPLOY_HOST || 'your-production-server.com',
      ref: 'origin/main',
      repo: process.env.DEPLOY_REPO || 'git@github.com:your-org/alam-lms.git',
      path: process.env.DEPLOY_PATH || '/var/www/alam-lms',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'production',
      },
    },
    
    staging: {
      user: process.env.STAGING_DEPLOY_USER || 'deploy',
      host: process.env.STAGING_DEPLOY_HOST || 'your-staging-server.com',
      ref: 'origin/develop',
      repo: process.env.DEPLOY_REPO || 'git@github.com:your-org/alam-lms.git',
      path: process.env.STAGING_DEPLOY_PATH || '/var/www/alam-lms-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};