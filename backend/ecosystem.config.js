/**
 * 生产启动：pm2 start ecosystem.config.js --env production
 * 重启：pm2 restart ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: 'fileupload-api',
      script: './bin/www',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
