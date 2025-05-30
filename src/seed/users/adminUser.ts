import { Payload } from 'payload'

/**
 * Creates a default admin user if one doesn't already exist
 * 
 * @param payload - Payload CMS instance
 * @returns Promise resolving to the created user or undefined if skipped
 */
export const seedAdminUser = async (payload: Payload): Promise<void> => {
  // Get admin credentials from environment variables with fallbacks
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  const name = process.env.ADMIN_NAME || 'Admin User'

  try {
    // Check if admin user already exists to avoid duplicates
    const { docs: existingAdmins } = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    if (existingAdmins.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email,
          password,
          name,
        },
      })
      
      console.log(`Default admin user (${email}) created successfully`)
    } else {
      console.log(`Admin user (${email}) already exists, skipping creation`)
    }
  } catch (error) {
    console.error('Error creating admin user:', error)
    // Don't throw the error to prevent application startup failure
  }
}
