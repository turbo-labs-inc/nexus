#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { promisify } = require('util');
const { kill } = require('process');

// Ensure cypress-dev.js is executable
try {
  fs.chmodSync(path.join(__dirname, 'cypress-dev.js'), '755');
} catch (e) {
  console.log('Could not set cypress-dev.js as executable, continuing anyway');
}

// Function to check if server is running
async function checkServer(url, retries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      console.log(`Checking if server is up (attempt ${attempts}/${retries})...`);
      
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('✅ Server is up and running!');
          resolve(true);
        } else {
          if (attempts >= retries) {
            reject(new Error(`Server responded with status code ${res.statusCode} after ${retries} attempts`));
          } else {
            setTimeout(check, interval);
          }
        }
      }).on('error', (err) => {
        if (attempts >= retries) {
          reject(new Error(`Server connection error after ${retries} attempts: ${err.message}`));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    
    check();
  });
}

// Start the dev server with all necessary fixes
console.log('🚀 Starting Next.js development server...');
const devServer = spawn('node', ['cypress-dev.js'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_DISABLE_MIDDLEWARE: '1',
    CYPRESS_TEST_MODE: 'true'
  }
});

let cypressProcess = null;

// Wait for server to be ready then start Cypress
checkServer('http://localhost:3131')
  .then(() => {
    console.log('🧪 Starting Cypress tests...');
    
    // Determine if we should run in headless mode
    const isHeadless = process.env.CYPRESS_HEADLESS === '1';
    const cypressCommand = isHeadless ? ['cypress', 'run'] : ['cypress', 'open'];
    
    console.log(`Running Cypress in ${isHeadless ? 'headless' : 'interactive'} mode`);
    
    cypressProcess = spawn('npx', cypressCommand, {
      stdio: 'inherit',
      shell: true
    });
    
    cypressProcess.on('exit', (code) => {
      console.log(`Cypress exited with code ${code}`);
      // Kill the dev server
      devServer.kill();
      process.exit(code);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    devServer.kill();
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (cypressProcess) cypressProcess.kill();
  devServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Terminating...');
  if (cypressProcess) cypressProcess.kill();
  devServer.kill();
  process.exit(0);
});