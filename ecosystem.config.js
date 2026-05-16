/**
 * PM2 Ecosystem Configuration for TruthForge AI
 * 
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 * 
 * View logs: pm2 logs truthforge
 * Restart:   pm2 restart truthforge
 * Stop:      pm2 stop truthforge
 * Delete:    pm2 delete truthforge
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'truthforge',
      
      // Script to execute
      script: './src/express-server.ts',
      loader: 'ts-node/esm',
      
      // Node arguments
      node_args: '--loader ts-node/esm',
      
      // Environment-specific configuration
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug',
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
        // Increase memory limit for production
        node_args: '--loader ts-node/esm --max-old-space-size=2048',
      },
      
      // Auto-restart on crash
      autorestart: true,
      
      // Watch for file changes (disable in production)
      watch: false,
      
      // Ignore file changes
      ignore_watch: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.env',
      ],
      
      // Number of instances to launch
      instances: 1,  // Use 'max' for cluster mode on multiple cores
      
      // Execution mode: 'cluster' or 'fork'
      exec_mode: 'fork',  // Use 'cluster' with instances: 'max' for scaling
      
      // Max restarts per hour
      max_restarts: 10,
      
      // Time window for max_restarts check (in seconds)
      restart_delay: 5000,  // Wait 5 seconds before restart
      
      // Kill timeout (graceful shutdown)
      kill_timeout: 5000,
      
      // Output log file location
      out_file: './logs/truthforge-out.log',
      
      // Error log file location
      error_file: './logs/truthforge-error.log',
      
      // Combined log file
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Merge logs from all instances
      merge_logs: true,
      
      // Health check
      health_check: {
        endpoint: '/health',
        interval: 60000,  // Check every 60 seconds
        port: 3000,
      },
    },
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/truthforge-ai.git',
      path: '/opt/truthforge',
      'post-deploy': 'npm install && npm run build && pm2 restart truthforge',
      'env': {
        NODE_ENV: 'production',
      },
    },
  },
};
