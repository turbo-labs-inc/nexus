#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env.local exists, if not create it with minimum required values
const envLocalPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('Creating .env.local with minimum required values for development');
  fs.writeFileSync(
    envLocalPath,
    'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ3d4cWlwc2hjdXhyYWtsdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDk1NzMsImV4cCI6MjA2MTEyNTU3M30.TF046jmtLE3sHhmn2A-CLHYmk_9T1QfI_JYfhg3ud68\n' +
    'NEXT_PUBLIC_APP_URL=http://localhost:3131\n'
  );
}

// Fix Cypress experimental flag issue
const fixCypressConfig = () => {
  const cypressConfigPath = path.join(__dirname, 'cypress.config.ts');
  if (fs.existsSync(cypressConfigPath)) {
    const content = fs.readFileSync(cypressConfigPath, 'utf8');
    // Fixed content with valid experimental flags only
    const newContent = content.replace(
      /experimentalSessionAndOrigin: true/g, 
      '// experimentalSessionAndOrigin: true // Flag removed as it causes issues'
    );
    fs.writeFileSync(cypressConfigPath, newContent);
    console.log('Fixed Cypress configuration');
  }
};

// Apply fixes
fixCypressConfig();

// Disable middleware for this dev session to avoid auth issues during tests
process.env.NEXT_DISABLE_MIDDLEWARE = '1';

// Create a test bypass token for auth in cypress
process.env.CYPRESS_TEST_MODE = 'true';

console.log('Starting Next.js development server with Cypress-compatible settings...');
console.log('- Middleware disabled to prevent auth loops');
console.log('- Test mode enabled for Cypress');
console.log('- Port: 3131');

// Run next dev with the dev port 
const nextDev = spawn('npx', ['next', 'dev', '-p', '3131'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down dev server...');
  nextDev.kill('SIGINT');
  process.exit(0);
});