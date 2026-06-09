/**
 * PM2 configuration file for Super Planner 9000
 *
 * Uses Vite in dev mode and binds to 0.0.0.0 so it can be reached from
 * the host/container network when needed.
 */
module.exports = {
  /** @type {import('pm2').StartOptions[]} */
  apps: [
    {
      name: 'super-planner-9000',
      cwd: '.',
      script: 'npm',
      args: ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'],
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
