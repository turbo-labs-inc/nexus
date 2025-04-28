"use client";

import { useState } from "react";
import { BaseConfigDialog, BaseConfigDialogProps } from "./base-config-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTransformNodeData } from "@/lib/workflow/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TransformNodeConfigProps = Omit<
  BaseConfigDialogProps,
  "nodeData" | "children" | "title" | "description" | "onSave"
> & {
  nodeData: DataTransformNodeData;
  onSave: (data: DataTransformNodeData) => void;
};

export function TransformNodeConfig({
  isOpen,
  onClose,
  onSave,
  nodeData,
  nodeId,
}: TransformNodeConfigProps) {
  const [formData, setFormData] = useState<DataTransformNodeData>({ ...nodeData });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  const handleSaveChanges = (baseData: DataTransformNodeData) => {
    onSave({
      ...baseData,
      ...formData,
    });
  };

  const getTransformTemplate = (type: string) => {
    switch (type) {
      case "map":
        return `// Transform each item in an array
function transform(input) {
  if (!Array.isArray(input)) {
    return input;
  }
  
  return input.map(item => {
    // Modify each item here
    return {
      ...item,
      transformed: true,
      // Add more properties or transformations
    };
  });
}`;
      case "filter":
        return `// Filter items in an array
function transform(input) {
  if (!Array.isArray(input)) {
    return input;
  }
  
  return input.filter(item => {
    // Return true to keep the item, false to remove it
    return item.someProperty === 'someValue';
  });
}`;
      case "reduce":
        return `// Reduce an array to a single value
function transform(input) {
  if (!Array.isArray(input)) {
    return input;
  }
  
  return input.reduce((accumulator, item) => {
    // Combine items into an accumulator
    return accumulator + item.value;
  }, 0); // Initial value (e.g., 0 for sum)
}`;
      case "custom":
      default:
        return `// Custom transformation
function transform(input) {
  // Your custom logic here
  
  // Example: Adding a property
  if (typeof input === 'object' && input !== null) {
    return {
      ...input,
      processed: true,
      timestamp: new Date().toISOString()
    };
  }
  
  return input;
}`;
    }
  };

  // Update transform function template when type changes
  const handleTransformTypeChange = (type: "map" | "filter" | "reduce" | "custom") => {
    handleChange("transformType", type);

    // Only replace the transform function if it's empty or matches a template
    const currentFn = formData.transformFunction || "";
    const isTemplateOrEmpty =
      currentFn.trim() === "" ||
      ["map", "filter", "reduce", "custom"].some((t) => currentFn === getTransformTemplate(t));

    if (isTemplateOrEmpty) {
      handleChange("transformFunction", getTransformTemplate(type));
    }
  };

  return (
    <BaseConfigDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSaveChanges}
      nodeData={nodeData}
      nodeId={nodeId}
      title="Configure Transform Node"
      description="Define how data should be transformed as it passes through this node."
    >
      <Tabs defaultValue="transform" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transform">Transformation</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="transform" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transformType" className="text-right">
              Transform Type
            </Label>
            <Select
              value={formData.transformType}
              onValueChange={(value: "map" | "filter" | "reduce" | "custom") =>
                handleTransformTypeChange(value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select transform type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="map">Map (transform each item)</SelectItem>
                <SelectItem value="filter">Filter (keep matching items)</SelectItem>
                <SelectItem value="reduce">Reduce (combine into single value)</SelectItem>
                <SelectItem value="custom">Custom Transformation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="transformFunction" className="pt-2 text-right">
              Transform Function
            </Label>
            <Textarea
              id="transformFunction"
              name="transformFunction"
              value={formData.transformFunction || ""}
              onChange={handleInputChange}
              className="col-span-3 font-mono text-sm"
              rows={15}
              placeholder="Enter your transformation function"
            />
          </div>
          <div className="col-span-3 pl-32 text-xs text-muted-foreground">
            <p className="mb-2">Your transform function should:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Accept a single <code>input</code> parameter
              </li>
              <li>Return the transformed data</li>
              <li>Handle edge cases (like null or unexpected data types)</li>
              <li>Be pure - avoid side effects or external dependencies</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="inputSchema" className="pt-2 text-right">
              Input Schema
            </Label>
            <Textarea
              id="inputSchema"
              name="inputSchema"
              value={formData.inputSchema ? JSON.stringify(formData.inputSchema, null, 2) : ""}
              onChange={(e) => {
                try {
                  const schema = JSON.parse(e.target.value);
                  handleChange("inputSchema", schema);
                } catch (error) {
                  // Keep as string if not valid JSON yet
                  handleChange("inputSchemaString", e.target.value);
                }
              }}
              className="col-span-3 font-mono"
              rows={7}
              placeholder="Enter expected input schema in JSON format"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="outputSchema" className="pt-2 text-right">
              Output Schema
            </Label>
            <Textarea
              id="outputSchema"
              name="outputSchema"
              value={formData.outputSchema ? JSON.stringify(formData.outputSchema, null, 2) : ""}
              onChange={(e) => {
                try {
                  const schema = JSON.parse(e.target.value);
                  handleChange("outputSchema", schema);
                } catch (error) {
                  // Keep as string if not valid JSON yet
                  handleChange("outputSchemaString", e.target.value);
                }
              }}
              className="col-span-3 font-mono"
              rows={7}
              placeholder="Enter expected output schema in JSON format"
            />
          </div>
        </TabsContent>
      </Tabs>
    </BaseConfigDialog>
  );
}
