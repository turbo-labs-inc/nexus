// This file is loaded automatically before your e2e test files.
// See https://on.cypress.io/configuration for more options.

// Import commands.ts using ES2015 syntax:
import "./commands";

// Alternatively, you can use CommonJS syntax:
// require('./commands')

// Handle uncaught exceptions
Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});