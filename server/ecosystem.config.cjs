module.exports = {
  apps: [{
    name: 'z1-docs-auth',
    script: './src/index.js',
    cwd: '/www/wwwroot/z1-docs/server',
    interpreter: 'node',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
  }]
};
