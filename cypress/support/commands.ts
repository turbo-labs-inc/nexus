// Custom commands for both E2E and Component Testing
// See https://on.cypress.io/custom-commands for more information

// Add additional command types to Cypress global interface
declare global {
  namespace Cypress {
    interface Chainable {
      // Login command for authentication testing
      login(email: string, password: string): Chainable<void>;
      // Create custom workflow
      createWorkflow(name: string, description?: string): Chainable<void>;
      // Add node to workflow
      addNodeToWorkflow(
        nodeType: string,
        position?: { x: number; y: number }
      ): Chainable<void>;
      // Connect nodes in workflow
      connectNodes(sourceId: string, targetId: string): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/auth/login");
    cy.get("input[name=\"email\"]").type(email);
    cy.get("input[name=\"password\"]").type(password);
    cy.get("button[type=\"submit\"]").click();
    cy.url().should("include", "/dashboard");
  });
});

// Workflow creation command
Cypress.Commands.add("createWorkflow", (name: string, description = "") => {
  cy.visit("/workflow-demo");
  cy.contains("button", "New Workflow").click();
  // Set workflow name in a real implementation
});

// Add node to workflow
Cypress.Commands.add(
  "addNodeToWorkflow",
  (nodeType: string, position = { x: 200, y: 200 }) => {
    // Simulate drag and drop
    cy.contains(nodeType)
      .trigger("dragstart")
      .trigger("dragleave");
    
    cy.get(".react-flow")
      .trigger("dragover", { clientX: position.x, clientY: position.y })
      .trigger("drop", { clientX: position.x, clientY: position.y })
      .trigger("dragend");
  }
);

// Connect nodes
Cypress.Commands.add("connectNodes", (sourceId: string, targetId: string) => {
  // In a real implementation, we would simulate connecting nodes by dragging from 
  // a source handle to a target handle
});