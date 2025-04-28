import { render, screen, fireEvent } from "@testing-library/react";
import { ConditionNodeConfig } from "../condition-node-config";
import { ConditionNodeData, ExecutionStatus } from "@/lib/workflow/types";

describe("ConditionNodeConfig", () => {
  const defaultNodeData: ConditionNodeData = {
    label: "Test Condition",
    description: "A test condition node",
    conditionType: "equals",
    condition: "",
    leftValue: "input.value",
    rightValue: "10",
    status: ExecutionStatus.IDLE,
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the condition node config dialog", () => {
    render(
      <ConditionNodeConfig
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={defaultNodeData}
        nodeId="condition-123"
      />
    );

    // Check dialog title
    expect(screen.getByText("Configure Condition Node")).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole("tab", { name: "Basic Settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Advanced" })).toBeInTheDocument();
    
    // Check basic form fields
    expect(screen.getByLabelText("Label")).toHaveValue("Test Condition");
    expect(screen.getByLabelText("Description")).toHaveValue("A test condition node");
    expect(screen.getByText("Equals (==)")).toBeInTheDocument();
    expect(screen.getByLabelText("Left Value")).toHaveValue("input.value");
    expect(screen.getByLabelText("Right Value")).toHaveValue("10");
  });

  it("updates form values when inputs change", () => {
    render(
      <ConditionNodeConfig
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={defaultNodeData}
        nodeId="condition-123"
      />
    );

    // Update label
    const labelInput = screen.getByLabelText("Label");
    fireEvent.change(labelInput, { target: { value: "Updated Condition" } });
    
    // For now, we'll just check that the label can be updated
    expect(labelInput).toHaveValue("Updated Condition");
    
    // Save the changes
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveButton);
    
    // Check if onSave was called
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it("renders the tabs for basic and advanced settings", () => {
    render(
      <ConditionNodeConfig
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={defaultNodeData}
        nodeId="condition-123"
      />
    );

    // Check that tabs are rendered
    expect(screen.getByRole("tab", { name: "Basic Settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Advanced" })).toBeInTheDocument();
  });

  it("closes dialog when cancel button is clicked", () => {
    render(
      <ConditionNodeConfig
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={defaultNodeData}
        nodeId="condition-123"
      />
    );

    // Click cancel button
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    // Check that onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});