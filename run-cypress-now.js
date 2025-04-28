#!/usr/bin/env node

/**
 * Quick Cypress Fix
 * 
 * This is a minimal script to get Cypress running immediately.
 * For a more comprehensive solution, run cypress-fix.js afterward.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Quick-fixing Cypress issues...');

// 1. Set environment variables that bypass middleware
process.env.NEXT_DISABLE_MIDDLEWARE = '1';
process.env.CYPRESS_TEST_MODE = 'true';

// 2. Kill any stray Next.js processes
try {
  console.log('Checking for stray Next.js processes...');
  execSync('pkill -f "next dev" || true');
  console.log('Cleared any existing Next.js processes');
} catch (e) {
  // Ignore errors - pkill may not find anything
}

// 3. Start Next.js with disabled middleware
console.log('Starting Next.js dev server with middleware disabled...');
console.log('This may take a moment...');

// Create custom .env.cypress file to ensure we have good test variables
const fs = require('fs');
const path = require('path');
const envCypressPath = path.join(__dirname, '.env.cypress');
const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ3d4cWlwc2hjdXhyYWtsdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDk1NzMsImV4cCI6MjA2MTEyNTU3M30.TF046jmtLE3sHhmn2A-CLHYmk_9T1QfI_JYfhg3ud68
NEXT_PUBLIC_APP_URL=http://localhost:3131
NEXT_DISABLE_MIDDLEWARE=1
CYPRESS_TEST_MODE=true
`;
fs.writeFileSync(envCypressPath, envContent);

const devServer = spawn('npx', ['next', 'dev', '-p', '3131'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_DISABLE_MIDDLEWARE: '1',
    CYPRESS_TEST_MODE: 'true',
    DOTENV_CONFIG_PATH: '.env.cypress'
  }
});

// Function to check server and test if it's responding
function checkServer(url, maxAttempts = 20, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      if (attempts > 1) {
        process.stdout.write('.');
        if (attempts % 10 === 0) process.stdout.write('\n');
      }
      
      // Check if server is running
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('\n✅ Server is up and running!');
          resolve(true);
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server responded with status code ${res.statusCode} after ${maxAttempts} attempts`));
          } else {
            setTimeout(check, interval);
          }
        }
      }).on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server connection error after ${maxAttempts} attempts: ${err.message}`));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    
    console.log('\n⏳ Waiting for server to start');
    check();
  });
}

// Wait for server to start then launch Cypress
console.log('Checking server connection (this may take a few seconds)...');

// We need http for server checking
const http = require('http');

// Check if server is responding, with a 15-second timeout
checkServer('http://localhost:3131')
  .then(() => {
    console.log('🚀 Starting Cypress...');
    const cypress = spawn('npx', ['cypress', 'open'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        CYPRESS_TEST_MODE: 'true'
      }
    });

    cypress.on('exit', (code) => {
      console.log(`Cypress exited with code ${code}`);
      devServer.kill();
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error(`\n❌ Server check failed: ${error.message}`);
    console.log('Killing server and trying a different approach...');
    
    // Kill the server
    devServer.kill();
    
    // Try a different approach - run with NEXT_TELEMETRY_DISABLED=1
    console.log('Starting server with telemetry disabled...');
    const devServerRetry = spawn('npx', ['next', 'dev', '-p', '3131'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NEXT_DISABLE_MIDDLEWARE: '1',
        CYPRESS_TEST_MODE: 'true',
        NEXT_TELEMETRY_DISABLED: '1',
        DOTENV_CONFIG_PATH: '.env.cypress'
      }
    });
    
    // Wait a bit longer this time
    setTimeout(() => {
      console.log('🚀 Starting Cypress (after delay)...');
      const cypress = spawn('npx', ['cypress', 'open'], {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          CYPRESS_TEST_MODE: 'true'
        }
      });

      cypress.on('exit', (code) => {
        console.log(`Cypress exited with code ${code}`);
        devServerRetry.kill();
        process.exit(0);
      });
    }, 8000);
  });

// Handle termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  devServer.kill();
  process.exit(0);
});

console.log('\n💡 For a complete fix, run:');
console.log('node cypress-fix.js');
console.log('npm run setup:e2e');
console.log('npm run test:e2e');