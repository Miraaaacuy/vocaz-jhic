// PM2 process file — jalankan: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "vocaz",
      cwd: __dirname,
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
        HOSTNAME: "0.0.0.0",
      },
      node_args: "--env-file=.env",
      instances: 1,
      autorestart: true,
      max_memory_restart: "700M",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};
