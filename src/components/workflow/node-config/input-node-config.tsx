"use client";

import { useState } from "react";
import { BaseConfigDialog, BaseConfigDialogProps } from "./base-config-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { InputNodeData } from "@/lib/workflow/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type InputNodeConfigProps = Omit<
  BaseConfigDialogProps,
  "nodeData" | "children" | "title" | "description" | "onSave"
> & {
  nodeData: InputNodeData;
  onSave: (data: InputNodeData) => void;
};

export function InputNodeConfig({
  isOpen,
  onClose,
  onSave,
  nodeData,
  nodeId,
}: InputNodeConfigProps) {
  const [formData, setFormData] = useState<InputNodeData>({ ...nodeData });

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

  const handleSwitchChange = (checked: boolean) => {
    handleChange("required", checked);
  };

  const handleSaveChanges = (baseData: InputNodeData) => {
    onSave({
      ...baseData,
      ...formData,
    });
  };

  const getDefaultValueField = () => {
    switch (formData.variableType) {
      case "string":
        return (
          <Input
            id="defaultValue"
            name="defaultValue"
            value={typeof formData.defaultValue === "string" ? formData.defaultValue : ""}
            onChange={handleInputChange}
            placeholder="Enter default string value"
          />
        );
      case "number":
        return (
          <Input
            id="defaultValue"
            name="defaultValue"
            type="number"
            value={typeof formData.defaultValue === "number" ? formData.defaultValue : ""}
            onChange={(e) => handleChange("defaultValue", parseFloat(e.target.value))}
            placeholder="Enter default number value"
          />
        );
      case "boolean":
        return (
          <Select
            value={formData.defaultValue?.toString() || "false"}
            onValueChange={(value) => handleChange("defaultValue", value === "true")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select default value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      case "object":
      case "array":
        return (
          <Textarea
            id="defaultValue"
            name="defaultValue"
            value={
              typeof formData.defaultValue === "object"
                ? JSON.stringify(formData.defaultValue, null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                const value = JSON.parse(e.target.value);
                handleChange("defaultValue", value);
              } catch (error) {
                // Keep the value as string if it's not valid JSON yet
                handleChange("defaultValueString", e.target.value);
              }
            }}
            className="font-mono"
            rows={5}
            placeholder={`Enter default ${formData.variableType === "object" ? "object" : "array"} in JSON format`}
          />
        );
      default:
        return (
          <Input
            id="defaultValue"
            name="defaultValue"
            value={formData.defaultValue?.toString() || ""}
            onChange={handleInputChange}
            placeholder="Enter default value"
          />
        );
    }
  };

  return (
    <BaseConfigDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSaveChanges}
      nodeData={nodeData}
      nodeId={nodeId}
      title="Configure Input Node"
      description="Set up the input parameters for this workflow."
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="variableType" className="text-right">
              Data Type
            </Label>
            <Select
              value={formData.variableType}
              onValueChange={(value: "string" | "number" | "boolean" | "object" | "array") =>
                handleChange("variableType", value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultValue" className="text-right">
              Default Value
            </Label>
            <div className="col-span-3">{getDefaultValueField()}</div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="required" className="text-right">
              Required
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch
                id="required"
                checked={formData.required || false}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="required" className="ml-2">
                {formData.required ? "Yes" : "No"}
              </Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          {(formData.variableType === "object" || formData.variableType === "array") && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="schema" className="pt-2 text-right">
                JSON Schema
              </Label>
              <Textarea
                id="schema"
                name="schema"
                value={formData.schema ? JSON.stringify(formData.schema, null, 2) : ""}
                onChange={(e) => {
                  try {
                    const schema = JSON.parse(e.target.value);
                    handleChange("schema", schema);
                  } catch (error) {
                    // Keep as string if not valid JSON yet
                    handleChange("schemaString", e.target.value);
                  }
                }}
                className="col-span-3 font-mono"
                rows={8}
                placeholder="Enter JSON schema for validation"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </BaseConfigDialog>
  );
}
