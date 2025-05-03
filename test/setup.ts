import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test if it exists
dotenv.config({ path: '.env.test' });

// Set up test database
async function setup() {
  try {
    console.log('Setting up test database...');
    
    // Create test database if it doesn't exist
    execSync('npx prisma migrate reset --force');
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

setup();