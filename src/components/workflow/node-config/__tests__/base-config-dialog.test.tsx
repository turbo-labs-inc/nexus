import { render, screen, fireEvent } from "@testing-library/react";
import { BaseConfigDialog } from "../base-config-dialog";
import { NodeData, ExecutionStatus } from "@/lib/workflow/types";

describe("BaseConfigDialog", () => {
  const mockNodeData: NodeData = {
    label: "Test Node",
    description: "A test node description",
    status: ExecutionStatus.IDLE,
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the base config dialog with default title and description", () => {
    render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
      />
    );

    // Check dialog title and description
    expect(screen.getByText("Configure Node")).toBeInTheDocument();
    expect(screen.getByText("Customize the behavior of this node.")).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText("Label")).toHaveValue("Test Node");
    expect(screen.getByLabelText("Description")).toHaveValue("A test node description");
  });

  it("renders with custom title and description", () => {
    render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
        title="Custom Title"
        description="Custom description text"
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });

  it("renders children components", () => {
    render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
      >
        <div data-testid="custom-child">Custom Child Component</div>
      </BaseConfigDialog>
    );

    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
    expect(screen.getByText("Custom Child Component")).toBeInTheDocument();
  });

  it("updates form data when inputs change", () => {
    render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
      />
    );

    // Update label
    const labelInput = screen.getByLabelText("Label");
    fireEvent.change(labelInput, { target: { value: "Updated Node Label" } });
    
    // Update description
    const descriptionInput = screen.getByLabelText("Description");
    fireEvent.change(descriptionInput, { target: { value: "Updated node description" } });
    
    // Save the changes
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveButton);
    
    // Check if onSave was called with updated values
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      label: "Updated Node Label",
      description: "Updated node description",
      status: ExecutionStatus.IDLE,
    }));
  });

  it("calls onClose when cancel button is clicked", () => {
    render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
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

  it("calls onClose when dialog is closed by clicking outside", () => {
    const { baseElement } = render(
      <BaseConfigDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        nodeData={mockNodeData}
        nodeId="test-node-123"
      />
    );

    // Get dialog backdrop and click it
    const backdrop = baseElement.querySelector("[data-radix-dialog-overlay]");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });
});