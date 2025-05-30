import { postgresAdapter } from '@payloadcms/db-postgres';
import { PGlite } from '@electric-sql/pglite';

// Track the PGlite instance to ensure we only create one
let pgliteInstance: PGlite | null = null;

/**
 * Creates a Payload CMS PostgreSQL adapter that uses PGlite for non-production environments
 * and real PostgreSQL for production.
 */
export const createPgliteAdapter = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  
  // For production, use the real PostgreSQL database
  if (isProd) {
    return postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URI || '',
        ssl: true, // Enable SSL for production environment
      },
    });
  }
  
  // For development and testing, use PGlite
  try {
    // Create a custom pg Pool that works with Payload CMS
    const customPgPool = {
      query: async (text: string, params?: any[]) => {
        // Initialize PGlite on first query if needed
        if (!pgliteInstance) {
          try {
            console.log('🧪 Initializing in-memory PostgreSQL with PGlite...');
            
            // Create in-memory PGlite instance
            pgliteInstance = new PGlite();
            
            // Wait for PGlite to be ready
            await pgliteInstance.waitReady;
            
            console.log('✅ PGlite initialized successfully');
          } catch (initError) {
            console.error('❌ Failed to initialize PGlite:', initError);
            throw initError;
          }
        }
        
        try {
          // Execute the query with parameters if provided
          if (params && params.length > 0) {
            return await pgliteInstance.query(text, params);
          } else {
            return await pgliteInstance.query(text);
          }
        } catch (queryError) {
          console.error('Error executing query with PGlite:', queryError);
          throw queryError;
        }
      },
      
      // Required Pool methods
      connect: async () => {
        // Initialize PGlite if needed
        if (!pgliteInstance) {
          console.log('🧪 Initializing PGlite on connect()...');
          pgliteInstance = new PGlite();
          await pgliteInstance.waitReady;
        }
        
        // Return a client-like object
        return {
          query: async (text: string, params?: any[]) => {
            try {
              if (params && params.length > 0) {
                return await pgliteInstance!.query(text, params);
              } else {
                return await pgliteInstance!.query(text);
              }
            } catch (error) {
              console.error('Error in client query:', error);
              throw error;
            }
          },
          release: () => {}, // No-op
          end: async () => {}, // No-op
        };
      },
      
      end: async () => {
        // No-op - we keep PGlite alive for the app's lifetime
      },
    };
    
    // Return a PostgreSQL adapter configured with our custom PGlite pool
    return postgresAdapter({
      pool: {
        // Use our custom pool implementation that forwards to PGlite
        ...customPgPool as any,
        // Add database name to the pool config to avoid "database does not exist" error
        database: 'payload_pglite',
      },
      // Disable SSL for local development
      migrationDir: './migrations',
    });
  } catch (error) {
    console.error('❌ Failed to create PGlite adapter:', error);
    
    // Fallback to real database if PGlite setup fails
    console.log('⚠️ Falling back to real PostgreSQL database');
    return postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URI || '',
        ssl: process.env.NODE_ENV === 'production',
      },
    });
  }
};
