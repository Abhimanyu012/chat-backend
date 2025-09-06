module.exports = {
  apps: [{
    name: "chat-backend",
    script: "src/index.js",
    env_production: {
      NODE_ENV: "production",
    },
    max_memory_restart: "300M",
    instances: "max",
    exec_mode: "cluster",
    exp_backoff_restart_delay: 100
  }]
};
