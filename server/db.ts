import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for serverless environment if running in Node.js
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set"); 
}

// Singleton pattern for pool instance
let poolInstance: Pool | null = null;
let isShuttingDown = false;

export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Reduced from 15 to better handle connection limits
      min: 2,  // Reduced from 3
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      ssl: true
    });

    // Event handlers with improved logging
    poolInstance.on('connect', (client) => {
      console.log('New client connected to pool');
    });

    poolInstance.on('remove', (client) => {
      if (!isShuttingDown) {
        console.log('Client removed from pool (normal operation)');
      }
    });

    poolInstance.on('error', (err) => {
      if (!isShuttingDown) {
        console.error('Pool error:', err);
      }
    });
  }
  return poolInstance;
}

export const pool = getPool();
export const db = drizzle({ client: pool, schema });

// Improved shutdown handler
export async function shutdownPool(): Promise<void> {
  if (isShuttingDown || !poolInstance) return;
  
  isShuttingDown = true;
  console.log('Starting pool shutdown...');
  
  try {
    await poolInstance.end();
    console.log('Pool successfully shutdown');
    poolInstance = null;
  } catch (err) {
    console.error('Error during pool shutdown:', err);
  } finally {
    isShuttingDown = false;
  }
}

// Handle process termination
const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
shutdownSignals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await shutdownPool();
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await shutdownPool();
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  await shutdownPool();
  process.exit(1);
});
