import { postgresAdapter } from '@payloadcms/db-postgres';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';

// In Node.js environments, we need to import a WebSocket implementation
let ws;
try {
  // Try to dynamically import the ws package
  ws = require('ws');
  
  // Configure Neon to use the ws implementation
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  console.log('✅ WebSocket support configured for Neon PostgreSQL');
} catch (error) {
  console.warn('⚠️ WebSocket package not found, falling back to HTTP for Neon connections');
  // If ws is not available, Neon will fall back to HTTP
}

// Track the connection pool to ensure we only create one
let neonPool: Pool | null = null;

/**
 * Creates a Payload CMS PostgreSQL adapter that uses Neon Serverless PostgreSQL
 * with WebSocket support for better performance in serverless environments.
 */
export const createNeonAdapter = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log('🔍 Neon adapter: Environment is', isProd ? 'production' : isDev ? 'development' : process.env.NODE_ENV || 'unknown');
  
  try {
    // Create Neon connection pool if it doesn't exist
    if (!neonPool) {
      console.log('🔌 Initializing Neon PostgreSQL with WebSocket support...');
      
      // Get connection string from environment variable
      const connectionString = process.env.DATABASE_URI;
      
      if (!connectionString) {
        console.error('⚠️ DATABASE_URI environment variable is not defined');
        console.log('📝 Please add your Neon PostgreSQL connection string to .env file:');
        console.log('DATABASE_URI=postgresql://username:password@hostname/database?sslmode=require');
        throw new Error('DATABASE_URI environment variable is not defined');
      }
      
      // Create a SQL query executor using Neon's WebSocket client
      const sql = neon(connectionString);
      
      // Create a pg Pool that works with Neon's WebSocket connection
      neonPool = new Pool({
        connectionString,
        max: isProd ? 20 : 10, // More connections for production
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        ssl: true, // Enable SSL for secure connections
      });
      
      // Test the connection
      try {
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Neon PostgreSQL WebSocket connection successful');
      } catch (testError) {
        console.error('❌ Failed to connect to Neon PostgreSQL:', testError);
        throw testError;
      }
      
      // Set up cleanup on process exit
      process.on('SIGINT', async () => {
        if (neonPool) {
          console.log('🧹 Cleaning up Neon PostgreSQL connections...');
          await neonPool.end();
          neonPool = null;
        }
        process.exit(0);
      });
    }
    
    // Return a PostgreSQL adapter configured with Neon
    // Pass the connection configuration instead of the pool instance
    return postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URI || '',
        ssl: true,
        max: isProd ? 20 : 10,
        idleTimeoutMillis: 30000,
      },
    });
  } catch (error: unknown) {
    // Properly handle the unknown error type
    console.error('❌ Failed to create Neon adapter:', error);
    
    // Extract error message with proper type checking
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    
    // Throw the error to prevent the application from starting with a broken database connection
    throw new Error(`Failed to initialize Neon PostgreSQL adapter: ${errorMessage}`);
  }
};
