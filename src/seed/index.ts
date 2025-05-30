import { Payload } from 'payload'
import { seedAdminUser } from './users/adminUser'

/**
 * Main seed function that orchestrates all seeding operations
 * 
 * @param payload - Payload CMS instance
 */
export const seed = async (payload: Payload): Promise<void> => {
  // Log the start of seeding process with more visibility
  console.log('\n\n🌱 PAYLOAD CMS: STARTING DATA SEEDING PROCESS 🌱\n')
  
  try {
    // Seed default admin user
    await seedAdminUser(payload)
    
    // Add other seed operations here as your application grows
    // e.g., await seedDefaultPages(payload)
    // e.g., await seedDefaultSettings(payload)
    
    console.log('✅ Data seeding completed successfully')
  } catch (error) {
    console.error('❌ Error during data seeding:', error)
    // Don't throw the error to prevent application startup failure
  }
}
