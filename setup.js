#!/usr/bin/env node

/**
 * HighLevel Booking Platform Setup Script
 * Sets up environment variables and database configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Welcome to HighLevel Booking Platform Setup\n');
  
  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await prompt('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('Please provide your PostgreSQL database credentials:\n');

  // Collect database configuration
  const dbHost = await prompt('Database Host (localhost): ') || 'localhost';
  const dbPort = await prompt('Database Port (5432): ') || '5432';
  const dbName = await prompt('Database Name (booking_platform): ') || 'booking_platform';
  const dbUser = await prompt('Database Username: ');
  const dbPassword = await prompt('Database Password: ');
  
  console.log('\nServer configuration:\n');
  const serverPort = await prompt('Server Port (3000): ') || '3000';
  const nodeEnv = await prompt('Environment (development): ') || 'development';

  // Generate .env file
  const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Server Configuration
PORT=${serverPort}
NODE_ENV=${nodeEnv}

# Testing Configuration
TEST_DB_NAME=${dbName}_test

# Optional: SSL Configuration
# DB_SSL=false

# Optional: CORS Configuration
# ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment configuration created successfully!');
    
    // Generate database.json for Sequelize CLI
    const databaseConfig = {
      development: {
        username: dbUser,
        password: dbPassword,
        database: dbName,
        host: dbHost,
        port: parseInt(dbPort),
        dialect: 'postgres',
        logging: true,
        pool: {
          max: 20,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },
      test: {
        username: dbUser,
        password: dbPassword,
        database: `${dbName}_test`,
        host: dbHost,
        port: parseInt(dbPort),
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },
      production: {
        username: dbUser,
        password: dbPassword,
        database: dbName,
        host: dbHost,
        port: parseInt(dbPort),
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 30,
          min: 5,
          acquire: 60000,
          idle: 10000
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    };

    const configPath = path.join(__dirname, 'src', 'config', 'database.json');
    fs.writeFileSync(configPath, JSON.stringify(databaseConfig, null, 2));
    console.log('✅ Database configuration generated successfully!');

    console.log('\n📋 Next Steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Create database: npm run db:create');
    console.log('3. Run migrations: npm run db:migrate');
    console.log('4. Seed database: npm run db:seed');
    console.log('5. Start development server: npm run dev');
    
    console.log('\n🧪 Testing:');
    console.log('- Run unit tests: npm test');
    console.log('- Run load tests: npm run load-test');
    console.log('- Run spike tests: npm run spike-test');
    
    console.log('\n📚 API Documentation:');
    console.log(`- http://localhost:${serverPort}/api/v1/api-docs`);
    console.log(`- Health check: http://localhost:${serverPort}/api/v1/health`);

  } catch (error) {
    console.error('❌ Error creating configuration files:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };