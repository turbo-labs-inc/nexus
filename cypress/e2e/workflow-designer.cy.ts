describe("Workflow Designer", () => {
  beforeEach(() => {
    cy.visit("/workflow-demo");
  });

  it("should load the workflow designer page", () => {
    cy.get("h1").contains("Workflow Designer");
    cy.get(".react-flow").should("exist");
    cy.get("button").contains("Execute").should("exist");
    cy.get("button").contains("Save").should("exist");
  });

  it("should load example workflow", () => {
    cy.contains("button", "Load Example").click();
    cy.get(".react-flow__node").should("have.length.at.least", 4);
    cy.get(".react-flow__edge").should("have.length.at.least", 3);
  });

  it("should be able to add a new node", () => {
    // Count nodes before
    cy.get(".react-flow__node").then($nodes => {
      const initialCount = $nodes.length;

      // Find a node in the palette and simulate drag and drop
      cy.contains("Fast-Agent")
        .trigger("dragstart")
        .trigger("dragleave");
      
      cy.get(".react-flow")
        .trigger("dragover", { clientX: 500, clientY: 300 })
        .trigger("drop", { clientX: 500, clientY: 300 })
        .trigger("dragend");

      // Verify new node was added
      cy.get(".react-flow__node").should("have.length", initialCount + 1);
    });
  });

  it("should be able to save a workflow", () => {
    // Load example
    cy.contains("button", "Load Example").click();
    
    // Save workflow
    cy.contains("button", "Save").click();
    
    // Should see saved workflow in the list
    cy.contains("button", "Example Workflow").should("exist");
  });

  // This would need to be adapted for actual execution
  it("should be able to execute a workflow", () => {
    // Load example
    cy.contains("button", "Load Example").click();
    
    // Execute workflow
    cy.contains("button", "Execute").click();
    
    // Should see execution badge
    cy.contains("Executing...").should("exist");
    
    // After execution completes (may need to adjust timeout)
    cy.contains("Executing...", { timeout: 10000 }).should("not.exist");
  });

  // Add more tests for:
  // - Configuring nodes
  // - Connecting nodes
  // - Deleting nodes
  // - Undo/redo functionality
});