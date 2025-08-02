// File: /root/BarLiberty/ecosystem.config.cjs
module.exports = {
  apps: [{
    name: "barliberty",
    script: "./server/index.ts",
    interpreter: "node",
    interpreter_args: "-r ts-node/register -r tsconfig-paths/register",
    instances: 2, // Optimal for 2-core Vultr instance
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "800M", // 80% of 1GB memory
    min_uptime: "60s",
    listen_timeout: 5000,
    kill_timeout: 3000,
    
    // Environment Configuration
    env: {
      // Core Settings
      NODE_ENV: "production",
      PORT: 3000,
      HOST: "0.0.0.0",
      
      // Database Configuration
      DATABASE_URL: "postgresql://neondb_owner:npg_SBPhYXJIe90N@ep-weathered-shape-adq5qznq.c-2.us-east-1.aws.neon.tech/neondb",
      PGSSLMODE: "require",
      CONNECTION_TIMEOUT: 30000,
      POOL_SIZE: 8, // Adjusted for Neon's connection limits
      
      // Security Settings
      SESSION_SECRET: crypto.randomBytes(32).toString('hex'), // Generate fresh secret
      SESSION_COOKIE_SECURE: "true",
      SESSION_COOKIE_SAMESITE: "lax",
      SESSION_COOKIE_HTTPONLY: "true",
      CSRF_PROTECTION: "true",
      
      // CORS Configuration
      CLIENT_URL: "http://155.138.204.253",
      ALLOWED_ORIGINS: "http://155.138.204.253",
      
      // Performance Tuning
      UV_THREADPOOL_SIZE: 4,
      NODE_OPTIONS: "--max-old-space-size=768", // 768MB memory limit
      GC_INTERVAL: 300000, // 5 minute GC interval
      
      // Monitoring
      INSTANCE_ID: "vultr-prod-1",
      DEPLOYMENT_ENV: "production"
    },
    
    // Log Management
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "/var/log/barliberty/error.log",
    out_file: "/var/log/barliberty/out.log",
    pid_file: "/var/run/barliberty.pid",
    
    // Advanced Process Management
    restart_delay: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};