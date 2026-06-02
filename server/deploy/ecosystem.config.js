// PM2 process file for the testapi.zerotoken.in backend.
// Lives on the server at /var/www/zerotoken/testapi/deploy/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'zerotoken-testapi',
      cwd:  '/var/www/zerotoken/testapi',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/zerotoken/testapi.err.log',
      out_file:   '/var/log/zerotoken/testapi.out.log',
      time: true,
    },
  ],
}
