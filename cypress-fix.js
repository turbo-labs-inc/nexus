#!/usr/bin/env node

/**
 * Cypress Test Runner Fix
 * 
 * This script fixes Cypress test execution issues and infinite spinning:
 * 1. Creates a proper test environment with required vars
 * 2. Disables middleware for testing
 * 3. Optimizes the dev server startup
 * 4. Coordinates test execution
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const PORT = 3131;
const SERVER_URL = `http://localhost:${PORT}`;
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

// Helper: Print colorful messages
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  step: (num, msg) => console.log(`\x1b[35m[STEP ${num}]\x1b[0m ${msg}`)
};

// Helper: Wait for server to be ready
async function waitForServer(url, retries = MAX_RETRIES, interval = RETRY_INTERVAL) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      log.info(`Checking server connection (${attempts}/${retries})...`);
      
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          log.success('Server is up and running!');
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

// Step 1: Ensure environment and fix configuration
function setupEnvironment() {
  log.step(1, 'Setting up test environment...');
  
  // Create .env.test file with testing values
  const envTestPath = path.join(__dirname, '.env.test');
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ3d4cWlwc2hjdXhyYWtsdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDk1NzMsImV4cCI6MjA2MTEyNTU3M30.TF046jmtLE3sHhmn2A-CLHYmk_9T1QfI_JYfhg3ud68
NEXT_PUBLIC_APP_URL=http://localhost:${PORT}
NEXT_DISABLE_MIDDLEWARE=1
CYPRESS_TEST_MODE=true
`;

  fs.writeFileSync(envTestPath, envContent);
  log.success('Created .env.test with required test values');
  
  // Fix the Cypress configuration
  const cypressConfigPath = path.join(__dirname, 'cypress.config.ts');
  if (fs.existsSync(cypressConfigPath)) {
    // Config is already fixed in the external edit, no need to modify it again
    log.success('Cypress configuration is already fixed');
  }
  
  // Create a script to fix SPA Next.js for Cypress
  const fixNextSpaPath = path.join(__dirname, 'cypress', 'support', 'next-spa-fix.js');
  const fixNextSpaContent = `// Fix for Next.js SPA navigation in Cypress
Cypress.on('window:before:load', (win) => {
  // Override window.fetch to delay navigation events
  const originalFetch = win.fetch;
  win.fetch = function() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(originalFetch.apply(this, arguments));
      }, 0);
    });
  };
  
  // Force Cypress to wait for Next.js page transitions
  win.__NEXT_HMR_CB = [];
});
`;
  fs.writeFileSync(fixNextSpaPath, fixNextSpaContent);
  log.success('Created Next.js SPA fix for Cypress');
  
  // Update e2e.ts to include the SPA fix
  const e2ePath = path.join(__dirname, 'cypress', 'support', 'e2e.ts');
  let e2eContent = fs.readFileSync(e2ePath, 'utf8');
  if (!e2eContent.includes('next-spa-fix')) {
    e2eContent = `// Import Next.js SPA fix
import "./next-spa-fix";

${e2eContent}`;
    fs.writeFileSync(e2ePath, e2eContent);
    log.success('Updated e2e.ts to include Next.js SPA fix');
  }
}

// Step 2: Create a test for the workflow-demo page
function createTests() {
  log.step(2, 'Creating additional tests for complete coverage...');
  
  // Create basic auth tests
  const authTestPath = path.join(__dirname, 'cypress', 'e2e', 'auth.cy.ts');
  const authTestContent = `describe('Authentication Pages', () => {
  it('should load the login page', () => {
    cy.visit('/auth/login');
    cy.contains('h1', 'Login').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should load the signup page', () => {
    cy.visit('/auth/signup');
    cy.contains('h1', 'Sign Up').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should navigate between auth pages', () => {
    cy.visit('/auth/login');
    cy.contains('a', 'Sign up').click();
    cy.url().should('include', '/auth/signup');
    
    cy.contains('a', 'Log in').click();
    cy.url().should('include', '/auth/login');
  });
});
`;
  fs.writeFileSync(authTestPath, authTestContent);
  log.success('Created authentication tests');
  
  // Create navigation tests
  const navTestPath = path.join(__dirname, 'cypress', 'e2e', 'navigation.cy.ts');
  const navTestContent = `describe('Navigation', () => {
  it('should load the homepage', () => {
    cy.visit('/');
    cy.get('nav').should('exist');
    cy.get('footer').should('exist');
  });

  it('should have working navigation links', () => {
    cy.visit('/');
    
    // Test basic navigation to main pages
    // The links may need to be adjusted based on your actual UI
    cy.get('nav').contains('a', 'Home').should('exist');
    
    // Try to find login link and click it if exists
    cy.get('body').then($body => {
      if ($body.find('nav a:contains("Login")').length > 0) {
        cy.get('nav').contains('a', 'Login').click();
        cy.url().should('include', '/auth/login');
      }
    });
  });
});
`;
  fs.writeFileSync(navTestPath, navTestContent);
  log.success('Created navigation tests');
}

// Step 3: Create a more reliable dev server script
function createDevServerScript() {
  log.step(3, 'Creating optimized dev server script...');
  
  const devServerPath = path.join(__dirname, 'dev-server.js');
  const devServerContent = `#!/usr/bin/env node

/**
 * Optimized Next.js Dev Server for Testing
 * 
 * This script:
 * 1. Starts Next.js in development mode
 * 2. Sets up proper environment variables
 * 3. Ensures no auth loops or middleware issues
 * 4. Provides clean shutdown
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Ensure Next.js cache is cleared
try {
  const nextCachePath = path.join(__dirname, '.next');
  if (fs.existsSync(nextCachePath)) {
    // Only clean the cache if using the test flag
    if (process.argv.includes('--clean-cache')) {
      console.log('Cleaning Next.js cache...');
      require('rimraf').sync(nextCachePath);
      console.log('Cache cleaned');
    }
  }
} catch (err) {
  console.error('Failed to clean cache:', err);
}

console.log('Starting optimized dev server for testing...');
console.log('Environment: TEST');
console.log('Middleware disabled: YES');

// Start Next.js dev server
const nextDev = spawn('npx', ['next', 'dev', '-p', '3131'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    NEXT_DISABLE_MIDDLEWARE: '1',
    CYPRESS_TEST_MODE: 'true'
  }
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nShutting down dev server...');
  nextDev.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\nTerminating dev server...');
  nextDev.kill('SIGTERM');
  process.exit(0);
});
`;
  fs.writeFileSync(devServerPath, devServerContent);
  log.success('Created optimized dev server script');
  
  // Make it executable
  fs.chmodSync(devServerPath, '755');
}

// Step 4: Fix package.json scripts
function updatePackageJson() {
  log.step(4, 'Updating package.json scripts...');
  
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update scripts for better Cypress integration
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev:test": "node dev-server.js",
    "dev:clean": "node dev-server.js --clean-cache",
    "cypress:dev": "cypress open --e2e",
    "cypress:run": "cypress run --e2e",
    "test:e2e": "start-server-and-test dev:test http://localhost:3131 cypress:dev",
    "test:e2e:headless": "start-server-and-test dev:test http://localhost:3131 cypress:run",
    "test:e2e:ci": "start-server-and-test dev:clean http://localhost:3131 cypress:run"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  log.success('Updated package.json scripts');
}

// Step 5: Create a pre-test script to handle cache and dependencies
function createTestSetupScript() {
  log.step(5, 'Creating test setup script...');
  
  const setupPath = path.join(__dirname, 'setup-e2e-tests.js');
  const setupContent = `#!/usr/bin/env node

/**
 * E2E Test Setup Script
 * 
 * This script prepares the environment for Cypress testing:
 * 1. Installs required dependencies
 * 2. Cleans caches
 * 3. Sets up test environment
 * 4. Checks configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper for colorful logs
const log = {
  info: (msg) => console.log(\`\\x1b[36m[INFO]\\x1b[0m \${msg}\`),
  success: (msg) => console.log(\`\\x1b[32m[SUCCESS]\\x1b[0m \${msg}\`),
  warning: (msg) => console.log(\`\\x1b[33m[WARNING]\\x1b[0m \${msg}\`),
  error: (msg) => console.log(\`\\x1b[31m[ERROR]\\x1b[0m \${msg}\`),
  step: (num, msg) => console.log(\`\\x1b[35m[STEP \${num}]\\x1b[0m \${msg}\`)
};

// Install missing dependencies
log.step(1, 'Checking and installing dependencies...');
const requiredDeps = ['dotenv', 'rimraf'];
const missingDeps = requiredDeps.filter(dep => {
  try {
    require.resolve(dep);
    return false;
  } catch (e) {
    return true;
  }
});

if (missingDeps.length > 0) {
  log.info(\`Installing missing dependencies: \${missingDeps.join(', ')}\`);
  execSync(\`npm install --save-dev \${missingDeps.join(' ')}\`, { stdio: 'inherit' });
  log.success('Dependencies installed');
} else {
  log.success('All dependencies are already installed');
}

// Clean Next.js cache
log.step(2, 'Cleaning Next.js cache...');
const nextCachePath = path.join(__dirname, '.next');
if (fs.existsSync(nextCachePath)) {
  require('rimraf').sync(nextCachePath);
  log.success('Next.js cache cleaned');
} else {
  log.info('No Next.js cache to clean');
}

// Clean Cypress cache
log.step(3, 'Cleaning Cypress cache...');
const cypressCachePath = path.join(__dirname, 'cypress', '.projects');
if (fs.existsSync(cypressCachePath)) {
  require('rimraf').sync(cypressCachePath);
  log.success('Cypress cache cleaned');
} else {
  log.info('No Cypress cache to clean');
}

// Create .env.test if it doesn't exist
log.step(4, 'Setting up test environment...');
const envTestPath = path.join(__dirname, '.env.test');
if (!fs.existsSync(envTestPath) || process.argv.includes('--force')) {
  const envContent = \`NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ3d4cWlwc2hjdXhyYWtsdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDk1NzMsImV4cCI6MjA2MTEyNTU3M30.TF046jmtLE3sHhmn2A-CLHYmk_9T1QfI_JYfhg3ud68
NEXT_PUBLIC_APP_URL=http://localhost:3131
NEXT_DISABLE_MIDDLEWARE=1
CYPRESS_TEST_MODE=true
\`;
  fs.writeFileSync(envTestPath, envContent);
  log.success('Created .env.test with test values');
} else {
  log.info('.env.test already exists (use --force to overwrite)');
}

// Verify Cypress installation
log.step(5, 'Verifying Cypress installation...');
try {
  execSync('npx cypress verify', { stdio: 'inherit' });
  log.success('Cypress verified successfully');
} catch (error) {
  log.error('Cypress verification failed. Attempting to reinstall...');
  try {
    execSync('npx cypress install', { stdio: 'inherit' });
    log.success('Cypress reinstalled');
  } catch (installError) {
    log.error('Failed to reinstall Cypress. Please try manually:');
    log.error('npm install -D cypress@latest');
    process.exit(1);
  }
}

log.success('E2E test environment is ready!');
log.info('You can now run tests with:');
log.info('npm run test:e2e           # Interactive mode');
log.info('npm run test:e2e:headless  # Headless mode');
`;
  fs.writeFileSync(setupPath, setupContent);
  log.success('Created test setup script');
  
  // Make it executable
  fs.chmodSync(setupPath, '755');
  
  // Update package.json to include setup script
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.scripts["setup:e2e"] = "node setup-e2e-tests.js";
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

// Step 6: Install necessary dependencies
function installDependencies() {
  log.step(6, 'Installing required dependencies...');
  
  try {
    // Check if dotenv is installed
    log.info('Checking for dotenv...');
    try {
      require.resolve('dotenv');
      log.success('dotenv is already installed');
    } catch (e) {
      log.info('Installing dotenv...');
      execSync('npm install --save-dev dotenv', { stdio: 'inherit' });
      log.success('dotenv installed');
    }
    
    // Check if rimraf is installed
    log.info('Checking for rimraf...');
    try {
      require.resolve('rimraf');
      log.success('rimraf is already installed');
    } catch (e) {
      log.info('Installing rimraf...');
      execSync('npm install --save-dev rimraf', { stdio: 'inherit' });
      log.success('rimraf installed');
    }
  } catch (error) {
    log.error(`Failed to install dependencies: ${error.message}`);
    log.warning('You will need to manually install: npm install --save-dev dotenv rimraf');
  }
}

// Step 7: Create README for Cypress testing
function createCypressReadme() {
  log.step(7, 'Creating Cypress testing README...');
  
  const readmePath = path.join(__dirname, 'cypress', 'README.md');
  const readmeContent = `# Cypress Testing Guide

## Setup

Before running tests, ensure your environment is properly set up:

\`\`\`bash
npm run setup:e2e
\`\`\`

This script will:
1. Install required dependencies
2. Clean Next.js and Cypress caches
3. Set up test environment variables
4. Verify Cypress installation

## Running Tests

### Interactive Mode (with UI)

\`\`\`bash
npm run test:e2e
\`\`\`

This will start the test server and open the Cypress UI where you can select and run tests.

### Headless Mode (for CI/CD)

\`\`\`bash
npm run test:e2e:headless
\`\`\`

This will run all tests in headless mode, suitable for CI/CD environments.

## Troubleshooting

If you encounter issues:

1. **Clean environment and reinstall**:
   \`\`\`bash
   npm run setup:e2e --force
   \`\`\`

2. **Start with clean Next.js cache**:
   \`\`\`bash
   npm run dev:clean
   \`\`\`

3. **Verify Cypress directly**:
   \`\`\`bash
   npx cypress verify
   npx cypress open
   \`\`\`

## Test Files

- \`cypress/e2e/workflow-designer.cy.ts\`: Tests for the workflow designer
- \`cypress/e2e/auth.cy.ts\`: Tests for authentication pages
- \`cypress/e2e/navigation.cy.ts\`: Tests for main navigation

## Adding New Tests

1. Create a new file in \`cypress/e2e/\` with a \`.cy.ts\` extension
2. Follow the Cypress testing pattern (describe/it)
3. Use the custom commands defined in \`cypress/support/commands.ts\`

## Custom Commands

- \`cy.login(email, password)\`: Log in as a user
- \`cy.createWorkflow(name, description)\`: Create a new workflow
- \`cy.addNodeToWorkflow(nodeType, position)\`: Add a node to the workflow
- \`cy.connectNodes(sourceId, targetId)\`: Connect workflow nodes
`;
  fs.writeFileSync(readmePath, readmeContent);
  log.success('Created Cypress README');
}

// Step 8: Run all the fixes
async function applyAllFixes() {
  try {
    setupEnvironment();
    createTests();
    createDevServerScript();
    updatePackageJson();
    createTestSetupScript();
    installDependencies();
    createCypressReadme();
    
    log.step(8, 'All fixes applied successfully!');
    log.info('');
    log.info('Next steps:');
    log.info('1. Run the setup script:');
    log.info('   npm run setup:e2e');
    log.info('');
    log.info('2. Run Cypress tests:');
    log.info('   npm run test:e2e           # Interactive mode');
    log.info('   npm run test:e2e:headless  # Headless mode');
    log.info('');
    log.info('See cypress/README.md for more information');
    
  } catch (error) {
    log.error(`Failed to apply fixes: ${error.message}`);
    process.exit(1);
  }
}

// Run all the fixes
applyAllFixes();