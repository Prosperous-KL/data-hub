module.exports = {
  apps: [
    {
      name: "prosperous-data-hub-api",
      script: "src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
