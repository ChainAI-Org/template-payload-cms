# Payload CMS Seed System

This directory contains seed functions for initializing default data in your Payload CMS application.

## Structure

The seed system follows a modular approach:

```
seed/
├── index.ts             # Main seed orchestrator
├── users/               # User-related seed functions
│   └── adminUser.ts     # Default admin user creation
└── README.md            # Documentation
```

## How It Works

The seed system runs during Payload's initialization phase via the `onInit` hook in `payload.config.ts`. It creates necessary default data without overwriting existing records.

### Current Seed Operations

- **Admin User**: Creates a default admin user if one doesn't exist

### Adding New Seed Functions

To add new seed operations:

1. Create a new file in an appropriate subdirectory (create the directory if needed)
2. Implement your seed function following the pattern in existing files
3. Import and call your function from `seed/index.ts`

## Environment Variables

You can customize the default admin user by setting these environment variables:

```
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Admin Name
```

## Best Practices

- Keep seed functions focused on a single responsibility
- Include proper error handling to prevent application startup failures
- Check if data exists before creating it to avoid duplicates
- Use environment variables for sensitive or configurable data
- Add clear logging for debugging purposes

## Security Considerations

- Change default passwords immediately in production environments
- Use strong, unique passwords for admin accounts
- Consider implementing additional security measures for production deployments
